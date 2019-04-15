function MediaControllerService() {
    
    var MEDIA_CONSTANTS = {
        NEXT: "next_music",
        PREVIOUS: "previous_music",
        TOGGLE_PLAY_PAUSE: "toggle_play_pause",
        MUTE: "toggle_mute_music"
    };

    var PLAYERS_PATTERN = [
        {
            url: 'https://www.youtube.com/watch?*',
            commands: {
                next: (tab) => 'document.querySelector(".ytp-next-button").click()',
                previous: (tab) => { 
                    var isList = tab.url.indexOf("list") > -1;
                    if( isList ) {
                        return 'document.querySelector(".ytp-prev-button").click()';
                    } else {
                        return 'window.history.back()';
                    }
                },
                togglePlayPause: (tab) => 'document.querySelector(".ytp-play-button").click()',
                mute: (tab) => 'document.querySelector(".ytp-mute-button").click()'
            }

        }, 
        {
            url: 'https://open.spotify.com/*',
            commands: {
                next: (tab) => 'document.querySelector(".spoticon-skip-forward-16").click()',
                previous: (tab) => 'document.querySelector(".spoticon-skip-back-16").click()',
                togglePlayPause: (tab) => 'document.querySelector(".control-button--circled").click()',
                mute: (tab) => 'document.querySelector(".spoticon-volume-16").click()' 
            }
        }
    ];

    function getCurrentMusicTabWithAction() {
        return new Promise((resolve, reject) => {
            var query = { url: PLAYERS_PATTERN.map(e => e.url)};

            var callback = function(tabs) {
                if(!tabs || !tabs.length) reject(null);

                var audioTab = tabs.filter( tab => tab.audible );

                var principalAudioTab = audioTab && audioTab.length ? audioTab[0] : tabs[0];

                let playerPattern = PLAYERS_PATTERN.find(e => principalAudioTab.url.indexOf(e.url.replace('*', '') ) > -1 );

                resolve({ 
                    tab: principalAudioTab,
                    pattern: playerPattern
                })
            }

            chrome.tabs.query(query, callback);
        })
    }

    function dispatchAction(tabId, code) {
        chrome.tabs.executeScript(tabId, { code: code });
    }

    function executeAction(command) {
        getCurrentMusicTabWithAction().then(( { tab, pattern} ) => {
            switch( command ) {
    
                case MEDIA_CONSTANTS.NEXT:
                    dispatchAction(tab.id, pattern.commands.next(tab));
                    break;
                case MEDIA_CONSTANTS.PREVIOUS:
                    dispatchAction(tab.id, pattern.commands.previous(tab));
                    break;
                case MEDIA_CONSTANTS.MUTE: 
                    dispatchAction(tab.id, pattern.commands.mute(tab));
                    break;
                case MEDIA_CONSTANTS.TOGGLE_PLAY_PAUSE:
                    dispatchAction(tab.id, pattern.commands.togglePlayPause(tab));
                    break;
                default:
                    console.error("command not found");
            }
        })
    }
    
    return {
        executeAction: executeAction
    }
}

function App() {

    var mediaController = MediaControllerService();

    function __init() {
        chrome.commands.onCommand.addListener(function(command) {
            __handleCommand(command)
        });
    }

    function __handleCommand( command ) {
        mediaController.executeAction(command);
    }

    return {
        init: __init
    }

}

var app = App();
app.init();
