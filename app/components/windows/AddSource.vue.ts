import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { WindowsService } from 'services/windows';
import { ScenesService } from 'services/scenes';
import { TSourceType, ISourceApi, ISourceAddOptions, SourcesService } from 'services/sources';
import ModalLayout from 'components/ModalLayout.vue';
import Selector from 'components/Selector.vue';
import { Display } from 'components/shared/ReactComponentList';
import { WidgetsService, WidgetDisplayData, WidgetType } from 'services/widgets';
import { $t } from 'services/i18n';
import { PlatformAppsService } from 'services/platform-apps';
import { EditorCommandsService } from 'services/editor-commands';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { UserService } from 'services/user';
import { ChatService } from 'services/chat';
import { CustomizationService, AudioService } from 'app-services';
import * as remote from '@electron/remote';

@Component({
  components: { ModalLayout, Selector, Display, HFormGroup },
})
export default class AddSource extends Vue {
  @Inject() sourcesService!: SourcesService;
  @Inject() scenesService: ScenesService;
  @Inject() windowsService!: WindowsService;
  @Inject() widgetsService: WidgetsService;
  @Inject() platformAppsService: PlatformAppsService;
  @Inject() private editorCommandsService: EditorCommandsService;
  @Inject() userService: UserService;
  @Inject() chatService: ChatService;
  @Inject() customizationService: CustomizationService;
  @Inject() audioService: AudioService;

  name = '';
  error = '';
  sourceType = this.windowsService.getChildWindowQueryParams().sourceType as TSourceType;
  sourceAddOptions = (this.windowsService.getChildWindowQueryParams().sourceAddOptions || {
    propertiesManagerSettings: {},
  }) as ISourceAddOptions;

  get widgetType() {
    return this.sourceAddOptions.propertiesManagerSettings.widgetType;
  }

  sources = this.sourcesService.views.getSources().filter(source => {
    const comparison = {
      type: this.sourceType,
      propertiesManager: this.sourceAddOptions.propertiesManager,
      widgetType: this.widgetType,
      appId: this.sourceAddOptions.propertiesManagerSettings.appId,
      appSourceId: this.sourceAddOptions.propertiesManagerSettings.appSourceId,
    };

    const isSameType = source.isSameType(
      comparison.propertiesManager === 'streamlabels'
        ? { ...comparison, isStreamlabel: true }
        : comparison,
    );

    return isSameType && source.sourceId !== this.scenesService.views.activeSceneId;
  });

  existingSources = this.sources.map(source => {
    return { name: source.name, value: source.sourceId };
  });

  selectedSourceId = this.sources[0] ? this.sources[0].sourceId : null;

  overrideExistingSource = false;

  mounted() {
    if (this.sourceAddOptions.propertiesManager === 'replay') {
      this.name = $t('Instant Replay');
    } else if (this.sourceAddOptions.propertiesManager === 'streamlabels') {
      this.name = $t('Stream Label');
    } else if (this.sourceAddOptions.propertiesManager === 'iconLibrary') {
      this.name = $t('Custom Icon');
    } else if (this.sourceAddOptions.propertiesManager === 'widget') {
      this.name = this.sourcesService.suggestName(
        WidgetDisplayData(this.platform)[this.widgetType].name,
      );
    } else if (this.sourceAddOptions.propertiesManager === 'platformApp') {
      const app = this.platformAppsService.views.getApp(
        this.sourceAddOptions.propertiesManagerSettings.appId,
      );
      const sourceName = app.manifest.sources.find(
        source => source.id === this.sourceAddOptions.propertiesManagerSettings.appSourceId,
      ).name;

      this.name = this.sourcesService.suggestName(sourceName);
    } else {
      const sourceType =
        this.sourceType &&
        this.sourcesService
          .getAvailableSourcesTypesList()
          .find(sourceTypeDef => sourceTypeDef.value === this.sourceType);

      this.name = this.sourcesService.suggestName(this.sourceType && sourceType.description);
    }
  }

  get platform() {
    return this.userService.views.platform.type;
  }

  get isNewSource() {
    if (this.sourceType === 'scene') return false;
    return this.overrideExistingSource || !this.existingSources.length;
  }

  addExisting() {
    const scene = this.scenesService.views.activeScene;
    if (!scene.canAddSource(this.selectedSourceId)) {
      // for now only a scene-source can be a problem

      remote.dialog.showErrorBox(
        $t('Error'),
        $t(
          'Unable to add a source: the scene you are trying to add already contains your current scene',
        ),
      );
      return;
    }

    this.editorCommandsService.executeCommand(
      'CreateExistingItemCommand',
      this.scenesService.views.activeSceneId,
      this.selectedSourceId,
    );

    this.close();
  }

  close() {
    this.windowsService.closeChildWindow();
  }

  addNew() {
    if (!this.name) {
      this.error = 'The source name is required';
    } else {
      let source: ISourceApi;

      if (this.sourceAddOptions.propertiesManager === 'widget') {
        const widget = this.widgetsService.createWidget(this.widgetType, this.name);
        source = widget.getSource();
      } else {
        const settings: Dictionary<any> = {};

        if (this.sourceAddOptions.propertiesManager === 'platformApp') {
          const size = this.platformAppsService.getAppSourceSize(
            this.sourceAddOptions.propertiesManagerSettings.appId,
            this.sourceAddOptions.propertiesManagerSettings.appSourceId,
          );
          settings.width = size.width;
          settings.height = size.height;
        }

        const item = this.editorCommandsService.executeCommand(
          'CreateNewItemCommand',
          this.scenesService.views.activeSceneId,
          this.name,
          this.sourceType,
          settings,
          {
            sourceAddOptions: {
              propertiesManager: this.sourceAddOptions.propertiesManager,
              propertiesManagerSettings: this.sourceAddOptions.propertiesManagerSettings,
            },
          },
        );

        source = item.source;
      }

      if (!source.video && source.hasProps()) {
        this.audioService.showAdvancedSettings(source.sourceId);
        return;
      }

      if (source.hasProps()) {
        this.sourcesService.showSourceProperties(source.sourceId);
      } else {
        this.close();
      }
    }
  }

  handleSubmit() {
    return this.isNewSource ? this.addNew() : this.addExisting();
  }

  get selectedSource() {
    return this.sourcesService.views.getSource(this.selectedSourceId);
  }
}
