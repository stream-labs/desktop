import { Component, Prop } from 'vue-property-decorator';
import { Multiselect } from 'vue-multiselect';
import { IInputMetadata, IListOption } from '../../shared/inputs';
import ListInput from 'components/shared/inputs/ListInput.vue';
import { BaseInput } from 'components/shared/inputs/BaseInput';
import { IAnimationMetadata } from './index'


const COMMON_ANIMATIONS = [
  'bounce', 'flash', 'pulse', 'rubberBand', 'shake', 'headShake', 'swing', 'tada', 'wobble', 'jello', 'flip', 'hinge',
  'jackInTheBox'
];

const IN_ANIMATIONS = [
  'bounceIn', 'bounceInDown', 'bounceInLeft', 'bounceInRight', 'bounceInUp',
  'fadeIn', 'fadeInDown', 'fadeInDownBig', 'fadeInLeft', 'fadeInLeftBig', 'fadeInRight', 'fadeInRightBig', 'fadeInUp',
  'fadeInUpBig',
  'flipInX', 'flipInY',
  'lightSpeedIn',
  'rotateInDownLeft', 'rotateInDownRight', 'rotateInUpLeft', 'rotateInUpRight',
  'jackInTheBox',
  'rollIn',
  'zoomIn', 'zoomInDown', 'zoomInLeft', 'zoomInRight', 'zoomInUp',
  'slideInDown', 'slideInLeft', 'slideInRight', 'slideInUp'

];

const OUT_ANIMATIONS = [
  'bounceOut', 'bounceOutDown', 'bounceOutLeft', 'bounceOutRight', 'bounceOutUp',
  'fadeOut', 'fadeOutDown', 'fadeOutDownBig', 'fadeOutLeft', 'fadeOutLeftBig', 'fadeOutRight', 'fadeOutRightBig',
  'fadeOutUp', 'fadeOutUpBig',
  'flipOutX', 'flipOutY',
  'lightSpeedOut',
  'rotateOut', 'rotateOutDownLeft', 'rotateOutDownRight', 'rotateOutUpLeft', 'rotateOutUpRight',
  'rollOut',
  'zoomOut', 'zoomOutDown', 'zoomOutLeft', 'zoomOutRight', 'zoomOutUp',
  'slideOutDown', 'slideOutLeft', 'slideOutRight', 'slideOutUp'
];


@Component({
  components: { ListInput }
})

export default class AnimationInput extends BaseInput<string, IAnimationMetadata> {

  @Prop()
  readonly value: string;

  @Prop()
  readonly metadata: IInputMetadata;

  @Prop()
  readonly title: string;


  get listInputMetadata() {

    const animations = [].concat(COMMON_ANIMATIONS);

    if (this.options.filter === 'in') {
      animations.push(...IN_ANIMATIONS);
    } else if (this.options.filter === 'out') {
      animations.push(...OUT_ANIMATIONS);
    } else {
      animations.push( ...IN_ANIMATIONS, ...OUT_ANIMATIONS);
    }

    return {
      ...this.options,
      options: animations.map(animationName => ({ title: animationName, value: animationName}))
    }
  }

}
