import { Component, Prop } from 'vue-property-decorator';
import { Onboarding, OnboardingStep } from 'streamlabs-beaker';
import TsxComponent from 'components/tsx-component';
import { OnboardingService } from 'services/onboarding';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
import Connect from './onboarding_steps/Connect';
import ObsImport from './onboarding_steps/ObsImport';

@Component({})
export default class OnboardingPage extends TsxComponent<{ params?: { isLogin?: boolean } }> {
  @Inject() onboardingService: OnboardingService;

  @Prop() params?: {
    isLogin?: boolean;
  };

  importedFromObs = false;
  currentStep = 1;

  importFromObs() {
    this.importedFromObs = true;
  }

  get remainingSteps() {
    return this.importedFromObs ? [''] : ['', '', ''];
  }

  continue() {
    this.currentStep = this.currentStep + 1;
  }

  complete() {
    this.currentStep = this.currentStep + 1;
  }

  render(h: Function) {
    return (
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
        <Onboarding
          steps={this.remainingSteps.length + 2}
          stepLocation="top"
          current={this.currentStep}
          skip={true}
          continueFunc={this.continue}
          completeFunc={this.complete}
        >
          <Connect slot="1" />
          <ObsImport slot="2" continue={() => this.continue} />
          <OnboardingStep slot="3">
            <template slot="title">Enable Cloudbot</template>
            <template slot="desc">
              Streamlabs Cloudbot is a chatbot that provides entertainment and moderation features
              for your stream.
            </template>
          </OnboardingStep>
          <OnboardingStep slot="4">
            <template slot="title">Let’s setup your custom streamer website</template>
            <template slot="desc">This is where your viewers will go to engage with you.</template>
          </OnboardingStep>
        </Onboarding>
      </div>
    );
  }
}
