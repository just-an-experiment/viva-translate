import initExtension from '../../common/utils/initialize-ext';
import HighlightTranslation from './highlight-to-translate';

initExtension('viva-highlight-to-translate', [() => new HighlightTranslation()]);
