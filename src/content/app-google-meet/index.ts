import initExtension from '../../common/utils/initialize-ext';
import GoogleMeet from './GoogleMeet';

async function init() {
  GoogleMeet.injectScript();
  initExtension('viva-google-meet', [() => {
    GoogleMeet.initialize();
    GoogleMeet.initHandler();
  }]);
}

init();
