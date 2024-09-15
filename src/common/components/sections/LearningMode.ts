import Settings from '../../utils/Settings';
import SectionComponent from './SectionComponent';
import Toggle from '../Toggle';
import { InternalEvents } from '../../constants';

class LearningMode extends SectionComponent {
  private static instance: LearningMode;

  private learningModeToggle?: Toggle;

  private classes: string[] = [];

  private constructor(classes: string[] = []) {
    super();
    this.classes = classes;
    this.initComponent();
    this.initListeners();
  }

  /** Inits the necessary UI elements for this component. */
  private initComponent() {
    this.container.classList.add(...this.classes, 'learning-mode');
    this.learningModeToggle = new Toggle(
      Settings.shared.learningMode,
      'meetings.settings.learning_mode'
    );

    this.learningModeToggle.onChangeListener((event: Event) => {
      const learningModeActive = (event?.target as HTMLInputElement).checked;
      Settings.shared.learningMode = learningModeActive;
    });

    this.container.append(this.learningModeToggle.container);
  }

  /** Inits event listeners. */
  private initListeners(): void {
    Settings.shared.on(InternalEvents.LEARNING_MODE, (value: boolean) => {
      if (this.learningModeToggle) this.learningModeToggle.toggle.checked = value;
    });
  }

  public static get shared(): LearningMode {
    if (!LearningMode.instance) {
      LearningMode.instance = new LearningMode();
    }
    return LearningMode.instance;
  }

  public destroy() {
    super.destroy();
  }
}

export default LearningMode;
