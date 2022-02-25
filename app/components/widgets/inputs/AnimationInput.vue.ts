import { Component, Prop } from 'vue-property-decorator';
import { IInputMetadata } from '../../shared/inputs';
import ListInput from 'components/shared/inputs/ListInput.vue';
import { BaseInput } from 'components/shared/inputs/BaseInput';
import { IAnimationMetadata } from './index';
import { $t } from 'services/i18n';

const eventInAnimations = () => [
  { title: $t('Bounce'), value: 'bounce' },
  { title: $t('Bounce In'), value: 'bounceIn' },
  { title: $t('Bounce In Down'), value: 'bounceInDown' },
  { title: $t('Bounce In Left'), value: 'bounceInLeft' },
  { title: $t('Bounce In Right'), value: 'bounceInRight' },
  { title: $t('Bounce In Up'), value: 'bounceInUp' },
  { title: $t('Fade In'), value: 'fadeIn' },
  { title: $t('Fade In Down'), value: 'fadeInDown' },
  { title: $t('Fade In Down Big'), value: 'fadeInDownBig' },
  { title: $t('Fade In Left'), value: 'fadeInLeft' },
  { title: $t('Fade In Left Big'), value: 'fadeInLeftBig' },
  { title: $t('Fade In Right'), value: 'fadeInRight' },
  { title: $t('Fade In Up'), value: 'fadeInUp' },
  { title: $t('Fade In Up Big'), value: 'fadeInUpBig' },
  { title: $t('Light Speed In'), value: 'lightSpeedIn' },
  { title: $t('Flash'), value: 'flash' },
  { title: $t('Pulse'), value: 'pulse' },
  { title: $t('Rubberband'), value: 'rubberband' },
  { title: $t('Shake'), value: 'shake' },
  { title: $t('Swing'), value: 'swing' },
  { title: $t('Tada'), value: 'tada' },
  { title: $t('Wobble'), value: 'wobble' },
  { title: $t('Jello'), value: 'jello' },
  { title: $t('Hinge'), value: 'hinge' },
  { title: $t('Roll In'), value: 'rollIn' },
  { title: $t('Rotate In Left'), value: 'rotateInLeft' },
  { title: $t('Rotate In Right'), value: 'rotateInRight' },
  { title: $t('Zoom In'), value: 'zoomIn' },
  { title: $t('Zoom In Down'), value: 'zoomInDown' },
  { title: $t('Zoom In Left'), value: 'zoomInLeft' },
  { title: $t('Zoom In Right'), value: 'zoomInRight' },
  { title: $t('Zoom In Up'), value: 'zoomInUp' },
  { title: $t('Slide In Down'), value: 'slideInDown' },
  { title: $t('Slide In Left'), value: 'slideInLeft' },
  { title: $t('Slide In Right'), value: 'slideInRight' },
];

const eventOutAnimations = () => [
  { title: $t('Bounce Out'), value: 'bounceOut' },
  { title: $t('Bounce Out Down'), value: 'bounceOutDown' },
  { title: $t('Bounce Out Left'), value: 'bounceOutLeft' },
  { title: $t('Bounce Out Right'), value: 'bounceOutRight' },
  { title: $t('Bounce Out Up'), value: 'bounceOutUp' },
  { title: $t('Fade Out'), value: 'fadeOut' },
  { title: $t('Fade Out Down'), value: 'fadeOutDown' },
  { title: $t('Fade Out Down Big'), value: 'fadeOutDownBig' },
  { title: $t('Fade Out Left'), value: 'fadeOutLeft' },
  { title: $t('Fade Out Left Big'), value: 'fadeOutLeftBig' },
  { title: $t('Fade Out Right'), value: 'fadeOutRight' },
  { title: $t('Fade Out Up'), value: 'fadeOutUp' },
  { title: $t('Fade Out Up Big'), value: 'fadeOutUpBig' },
  { title: $t('Light Speed Out'), value: 'lightSpeedOut' },
  { title: $t('Hinge'), value: 'hinge' },
  { title: $t('Roll Out'), value: 'rollOut' },
  { title: $t('Rotate Out Left'), value: 'rotateOutLeft' },
  { title: $t('Rotate Out Right'), value: 'rotateOutRight' },
  { title: $t('Zoom Out'), value: 'zoomOut' },
  { title: $t('Zoom Out Down'), value: 'zoomOutDown' },
  { title: $t('Zoom Out Left'), value: 'zoomOutLeft' },
  { title: $t('Zoom Out Right'), value: 'zoomOutRight' },
  { title: $t('Zoom Out Up'), value: 'zoomOutUp' },
];

const inAnimations = () => [
  { title: $t('Bounce In'), value: 'bounceIn' },
  { title: $t('Bounce In Down'), value: 'bounceInDown' },
  { title: $t('Bounce In Left'), value: 'bounceInLeft' },
  { title: $t('Bounce In Right'), value: 'bounceInRight' },
  { title: $t('Bounce In Up'), value: 'bounceInUp' },
  { title: $t('Fade In'), value: 'fadeIn' },
  { title: $t('Fade In Down'), value: 'fadeInDown' },
  { title: $t('Fade In Down Big'), value: 'fadeInDownBig' },
  { title: $t('Fade In Left'), value: 'fadeInLeft' },
  { title: $t('Fade In Left Big'), value: 'fadeInLeftBig' },
  { title: $t('Fade In Right'), value: 'fadeInRight' },
  { title: $t('Fade In Right Big'), value: 'fadeInRightBig' },
  { title: $t('Fade In Up'), value: 'fadeInUp' },
  { title: $t('Fade In Up Big'), value: 'fadeInUpBig' },
  { title: $t('Flip In X'), value: 'flipInX' },
  { title: $t('Flip In Y'), value: 'flipInY' },
  { title: $t('Light Speed In'), value: 'lightSpeedIn' },
  { title: $t('Rotate In'), value: 'rotateIn' },
  { title: $t('Rotate In Down Left'), value: 'rotateInDownLeft' },
  { title: $t('Rotate In Down Right'), value: 'rotateInDownRight' },
  { title: $t('Rotate In Up Left'), value: 'rotateInUpLeft' },
  { title: $t('Rotate In Up Right'), value: 'rotateInUpRight' },
  { title: $t('Roll In'), value: 'rollIn' },
  { title: $t('Zoom In'), value: 'zoomIn' },
  { title: $t('Zoom In Down'), value: 'zoomInDown' },
  { title: $t('Zoom In Left'), value: 'zoomInLeft' },
  { title: $t('Zoom In Right'), value: 'zoomInRight' },
  { title: $t('Zoom In Up'), value: 'zoomInUp' },
  { title: $t('Slide In Down'), value: 'slideInDown' },
  { title: $t('Slide In Left'), value: 'slideInLeft' },
  { title: $t('Slide In Right'), value: 'slideInRight' },
  { title: $t('Slide In Up'), value: 'slideInUp' },
];

const outAnimations = () => [
  { title: $t('Bounce Out'), value: 'bounceOut' },
  { title: $t('Bounce Out Down'), value: 'bounceOutDown' },
  { title: $t('Bounce Out Left'), value: 'bounceOutLeft' },
  { title: $t('Bounce Out Right'), value: 'bounceOutRight' },
  { title: $t('Bounce Out Up'), value: 'bounceOutUp' },
  { title: $t('Fade Out'), value: 'fadeOut' },
  { title: $t('Fade Out Down'), value: 'fadeOutDown' },
  { title: $t('Fade Out Down Big'), value: 'fadeOutDownBig' },
  { title: $t('Fade Out Left'), value: 'fadeOutLeft' },
  { title: $t('Fade Out Left Big'), value: 'fadeOutLeftBig' },
  { title: $t('Fade Out Right'), value: 'fadeOutRight' },
  { title: $t('Fade Out Right Big'), value: 'fadeOutRightBig' },
  { title: $t('Fade Out Up'), value: 'fadeOutUp' },
  { title: $t('Fade Out Up Big'), value: 'fadeOutUpBig' },
  { title: $t('Flip Out X'), value: 'flipOutX' },
  { title: $t('Flip Out Y'), value: 'flipOutY' },
  { title: $t('Light Speed Out'), value: 'lightSpeedOut' },
  { title: $t('Rotate Out'), value: 'rotateOut' },
  { title: $t('Rotate Out Down Left'), value: 'rotateOutDownLeft' },
  { title: $t('Rotate Out Down Right'), value: 'rotateOutDownRight' },
  { title: $t('Rotate Out Up Left'), value: 'rotateOutUpLeft' },
  { title: $t('Rotate Out Up Right'), value: 'rotateOutUpRight' },
  { title: $t('Roll Out'), value: 'rollOut' },
  { title: $t('Zoom Out'), value: 'zoomOut' },
  { title: $t('Zoom Out Down'), value: 'zoomOutDown' },
  { title: $t('Zoom Out Left'), value: 'zoomOutLeft' },
  { title: $t('Zoom Out Right'), value: 'zoomOutRight' },
  { title: $t('Zoom Out Up'), value: 'zoomOutUp' },
  { title: $t('Slide Out Down'), value: 'slideOutDown' },
  { title: $t('Slide Out Left'), value: 'slideOutLeft' },
  { title: $t('Slide Out Right'), value: 'slideOutRight' },
  { title: $t('Slide Out Up'), value: 'slideOutUp' },
];

const textAnimations = () => [
  { title: $t('None'), value: '' },
  { title: $t('Bounce'), value: 'bounce' },
  { title: $t('Pulse'), value: 'pulse' },
  { title: $t('Rubber Band'), value: 'rubberBand' },
  { title: $t('Tada'), value: 'tada' },
  { title: $t('Wave'), value: 'wave' },
  { title: $t('Wiggle'), value: 'wiggle' },
  { title: $t('Wobble'), value: 'wobble' },
];

@Component({
  components: { ListInput },
})
export default class AnimationInput extends BaseInput<string, IAnimationMetadata> {
  @Prop()
  readonly value: string;

  @Prop()
  readonly metadata: IInputMetadata;

  @Prop()
  readonly title: string;

  get listInputMetadata() {
    switch (this.options.filter) {
      case 'in':
        return { ...this.options, options: inAnimations() };
      case 'out':
        return { ...this.options, options: outAnimations() };
      case 'text':
        return { ...this.options, options: textAnimations() };
      case 'eventIn':
        return { ...this.options, options: eventInAnimations() };
      case 'eventOut':
        return { ...this.options, options: eventOutAnimations() };
      default:
        return {
          ...this.options,
          options: textAnimations().concat(inAnimations()).concat(outAnimations()),
        };
    }
  }
}
