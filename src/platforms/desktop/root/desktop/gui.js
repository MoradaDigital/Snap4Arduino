IDE_Morph.prototype.originalOpenIn = IDE_Morph.prototype.openIn;
IDE_Morph.prototype.openIn = function (world) {
    this.checkForCLIparams();
    this.originalOpenIn(world);
    this.checkForNewVersion();
};

IDE_Morph.prototype.checkForNewVersion = function () {
    var myself = this;
    this.getURL(
        'https://api.github.com/repos/bromagosa/Snap4Arduino/releases/latest',
        function (response) {
            var current = myself.version().split('.'),
                latest = JSON.parse(response).tag_name.split('.'),
                versionLength = Math.max(current.length, latest.length);

            console.log('current: ' + current);
            console.log('latest: ' + latest);

            function outdatedVersion () {
                for (var i = 0; i < versionLength; i += 1) {
                    current[i] = Number(current[i]) || 0;
                    latest[i] = Number(latest[i]) || 0;
                    if (current[i] < latest[i]) {
                        return true;
                    }
                    if (current[i] > latest[i]) {
                        return false;
                    }
                }
                return false;
            };

            if (outdatedVersion()) {
                this.confirm(
                    'A new version of Snap4Arduino has been released: '
                    + latest
                    + '\nDo you wish to download it?',
                    'New version available',
                    function () {
                        myself.downloadVersion(latest);
                    }
                );
            }
        }
    );
};

IDE_Morph.prototype.downloadVersion = function (versionName) {
    var os = this.osName();

    nw.Shell.openExternal(
        'http://snap4arduino.org/downloads/'
            + versionName 
            + '/Snap4Arduino_desktop-'
            + os
            + '-'
            + this.arch()
            + '_'
            + versionName
            + (os === 'gnu' ? '.tar.gz' : '.zip')
    );
};

IDE_Morph.prototype.osName = function () {
    var platform = require('os').platform(),
        platformDict = {
            'linux' : 'gnu',
            'win32' : 'win',
            'darwin': 'osx'
        };

    return platformDict[platform];
};

IDE_Morph.prototype.arch = function () {
    return ((require('os').arch() === 'x64' || process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432'))
            ? 64 
            : 32);
};

IDE_Morph.prototype.checkForCLIparams = function () {
    var myself = this,
        language, fileName,
        fs = require('fs'),
        params = nw.App.argv;

    params.forEach(function (each) {
        if (each.indexOf('--load=') === 0) {
            fileName = each.split('=')[1];
            fs.readFile(
                fileName,
                'utf8',
                function (err, data) {
                    if (err) {
                        myself.inform(
                            'Error reading ' + fileName, 
                            'The file system reported:\n\n' + err);
                    } else {
                        if (myself.userLanguage) {
                            location.hash = '#open:' + data;
                            myself.loadNewProject = true;
                        } else {
                            myself.droppedText(data);
                        }
                    }
                }
            ); 
        } else if (each.indexOf('--lang') === 0) {
            language = each.split('=')[1];
            fileName = 's4a/lang-' + language + '.js';
            if (!fs.existsSync(fileName)) {
                // we just need this file to exist, that's all
                fs.writeFileSync(fileName, '');
            }
            myself.userLanguage = (language !== 'en') ? language : null;
            myself.loadNewProject = true;
        }
    });
};