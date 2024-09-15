import initExtension from '../../common/utils/initialize-ext';
import LiveCC from './LiveCC';

initExtension('viva-live-cc', [() => LiveCC.shared.initialize()]);
