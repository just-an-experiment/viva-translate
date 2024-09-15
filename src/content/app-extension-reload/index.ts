import { isIframe } from '../../common/utils/helpers';
import I18n from '../../common/utils/language';
import Notifications, { NOTIFICATION } from '../../common/components/notifications/Notifications';

const initExtension = async () => {
  await I18n.init();
  Notifications.shared.removeAllFromPage();

  /* Clean up old viva elements. */
  const oldVivaContainers = document?.querySelectorAll('.viva_styles_content');
  if (oldVivaContainers?.length > 0) {
    oldVivaContainers.forEach((el, i) => {
      if (i !== oldVivaContainers.length - 1) el.remove();
      if (i === oldVivaContainers.length - 1) el.innerHTML = '';
    });
  }
  Notifications.shared.showNotification(NOTIFICATION.RELOAD_NOTIFICATION);
};

if (!isIframe()) initExtension();
