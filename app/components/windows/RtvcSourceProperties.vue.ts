import { Component, Watch } from 'vue-property-decorator';
import SourceProperties from './SourceProperties.vue';
import { RtvcStateService } from 'app-services';
import { Inject } from 'services/core/injector';
import VueSlider from 'vue-slider-component';
import Multiselect from 'vue-multiselect';
import { AudioService } from '../../services/audio'
import * as obs from '../../../obs-api';
import { IObsListInput, IObsListOption, TObsValue } from 'components/obs/inputs/ObsInput';

// source用
type SourcePropKey = 'device' | 'input_gain' | 'output_gain' | 'pitch_shift' | 'pitch_shift_mode' | 'pitch_snap' | 'primary_voice' | 'secondary_voice' | 'amount'

// manual保持用
type ManualParamKey = 'name' | 'inputGain' | 'pitchShift' | 'amount' | 'primaryVoice' | 'secondaryVoice';


interface ManualParam {
  name: string
  pitchShift: number
  amount: number
  primaryVoice: number
  secondaryVoice: number
  // inputGain: number
  // pitchShiftMode
}

interface StateParam {
  currentIndex: string
  manuals: ManualParam[]
}

@Component({
  components: {
    VueSlider,
    Multiselect,
  },
})
export default class RtvcSourceProperties extends SourceProperties {

  @Inject() rtvcStateService: RtvcStateService
  @Inject() audioService: AudioService;

  readonly manualMax = 5

  readonly presetValues = [
    { index: 'preset/0', name: "琴詠ニア", image: "./media/images/nvoice.png", icon: "./media/images/test_icon.png", pitchShift: 0, primaryVoice: 100, secondaryVoice: -1, amount: 0 },
    { index: 'preset/1', name: "ずんだもん", image: "./media/images/nvoice_bg.png", icon: "./media/images/test_icon.png", pitchShift: 0, primaryVoice: 101, secondaryVoice: -1, amount: 0 },
    { index: 'preset/2', name: "春日部つむぎ", image: "./media/images/windows_bg.png", icon: "./media/images/test_icon.png", pitchShift: 0, primaryVoice: 102, secondaryVoice: -1, amount: 0 },
    //"../../../media/images/nvoice.png" だがvueがpath変換するので
  ]

  // default
  // input_gain=0.0 output_gain=0.0 pitch_shift:0.0 picth_shift_mode=1 snap=0.0
  // primary=100 secondary=-1 amonut=0.0

  initialMonitoringType: obs.EMonitoringType

  manuals: ManualParam[]
  currentIndex: string = "preset/0"
  isMonitor: boolean = false
  canceled = false

  name = ""
  image = ""
  device: TObsValue = 0

  primaryVoice: TObsValue = 0
  secondaryVoice: TObsValue = 0
  pitchShift: TObsValue = 0
  amount: TObsValue = 0

  // v-modelが {} での値で更新されるので噛ませる
  primaryVoiceModel: IObsListOption<number> = { description: '', value: 0 }
  secondaryVoiceModel: IObsListOption<number> = { description: '', value: 0 }
  deviceModel: IObsListOption<number> = { description: '', value: 0 }

  get presetList() { return this.presetValues.map(a => { return { value: a.index, name: a.name, icon: a.icon } }) }
  manualList: { value: string, name: string, icon: string }[] = []
  updateManualList() {
    // add,delに反応しないのでコード側から変更指示
    this.manualList = this.manuals.map((a, idx) => { return { value: `manual/${idx}`, name: a.name, icon: "./media/images/test_icon.png" } })
  }
  //  get manualList() { return this.manuals.map((a, idx) => { return { value: `manual/${idx}`, name: a.name, icon: "" } }) }

  // マニュアル操作で選べないvoice
  // value,description (indexはsecondaryなどでずれるのでvalueでチェックすること)
  // 100 kotoyomi_nia
  // 101 zundamon
  // 103 kasukabe_tsumugi
  readonly nonManualVoiceValues = [100, 101, 102]

  get primaryVoiceList() { return this.getPropertyOptions('primary_voice').filter(a => !this.nonManualVoiceValues.includes(a.value)) }
  get secondaryVoiceList() { return this.getPropertyOptions('secondary_voice').filter(a => !this.nonManualVoiceValues.includes(a.value)) }
  get deviceList() { return this.getPropertyOptions('device') }

  get isPreset() {
    if (!this.currentIndex) return false
    return this.currentIndex.includes('preset')
  }

  @Watch('currentIndex')
  onChangeIndex() {
    console.log(`-- index changed to ${this.currentIndex}`)
    const idx = this.getCurrentManualIndex()
    if (idx >= 0) { // for manuals
      this.name = this.getManualParam('name')
      this.pitchShift = this.getManualParam('pitchShift')
      this.amount = this.getManualParam('amount')
      this.primaryVoice = this.getManualParam('primaryVoice')
      this.secondaryVoice = this.getManualParam('secondaryVoice')
    } else { // for presets
      const p = this.presetValues.find(a => a.index === this.currentIndex)
      if (!p) return
      this.pitchShift = p.pitchShift
      this.amount = p.amount
      this.primaryVoice = p.primaryVoice
      this.secondaryVoice = p.secondaryVoice
      this.image = p.image
    }

    this.primaryVoiceModel = this.getPropertyOptionByValue('primary_voice', this.primaryVoice)
    this.secondaryVoiceModel = this.getPropertyOptionByValue('secondary_voice', this.secondaryVoice)
    this.deviceModel = this.getPropertyOptionByValue('device', this.device)

    // sourcesへも反映
    this.setPropertyValue('pitch_shift', this.pitchShift)
    this.setPropertyValue('amount', this.amount)
    this.setPropertyValue('primary_voice', this.primaryVoice)
    this.setPropertyValue('secondary_voice', this.secondaryVoice)
  }

  // GET,SETのCOMPUTEDではへんな動きするのでWATCH主体で
  // readonlyはgetでも

  @Watch('name')
  onChangeName() {
    this.setManualParam('name', this.name)
    const idx = this.getCurrentManualIndex()
    if (idx >= 0) this.manualList[idx].name = this.name // 画面反映
  }

  @Watch('pitchShift')
  onChangePitchShift() {
    this.setManualParam('pitchShift', this.pitchShift)
    this.setPropertyValue('pitch_shift', this.pitchShift)
  }

  @Watch('amount')
  onChangeAmount() {
    this.setManualParam('amount', this.amount)
    this.setPropertyValue('amount', this.amount)
  }

  @Watch('primaryVoiceModel')
  onChangePrimaryVoice() {
    this.primaryVoice = this.primaryVoiceModel.value
    this.setManualParam('primaryVoice', this.primaryVoice)
    this.setPropertyValue('primary_voice', this.primaryVoice)
  }

  @Watch('secondaryVoiceModel')
  onChangeSecondaryVoice() {
    this.secondaryVoice = this.secondaryVoiceModel.value
    this.setManualParam('secondaryVoice', this.secondaryVoice)
    this.setPropertyValue('secondary_voice', this.secondaryVoice)
  }

  @Watch('deviceModel')
  onChangeDevice() {
    this.device = this.deviceModel.value
    this.setPropertyValue('device', this.device)
  }

  @Watch('isMonitor')
  onChangeMonitor() {
    // on値は踏襲かoffならmonitor only, offはNoneでよい
    const onValue = this.initialMonitoringType !== obs.EMonitoringType.None ? this.initialMonitoringType : obs.EMonitoringType.MonitoringOnly
    const monitoringType = this.isMonitor ? onValue : obs.EMonitoringType.None
    this.audioService.setSettings(this.sourceId, { monitoringType })
  }

  // -- manual param in/out

  getManualParam(key: ManualParamKey): any {
    const idx = this.getCurrentManualIndex()
    if (idx < 0) return undefined
    return this.manuals[idx][key]
  }

  setManualParam(key: ManualParamKey, value: any) {
    const idx = this.getCurrentManualIndex()
    if (idx < 0) return
    this.manuals[idx][key as any] = value
  }

  getCurrentManualIndex(): number {
    return this.getManualIndexNum(this.currentIndex)
  }

  getManualIndexNum(index: string): number {
    const s = index.split('/')
    if (s.length === 2 && s[0] === 'manual') return Number(s[1])
    return -1
  }

  // -- sources in/out

  getPropertyValue(key: SourcePropKey): TObsValue {
    const p = this.properties.find(a => a.name === key)
    return p ? p.value : undefined
  }

  getPropertyOptions(key: SourcePropKey): IObsListOption<number>[] {
    const p = this.properties.find(a => a.name === key) as IObsListInput<any>
    return p ? p.options : []
  }

  getPropertyOptionByValue(key: SourcePropKey, value: any): IObsListOption<number> {
    const list = this.getPropertyOptions(key)
    return list.find(a => a.value === value) ?? { description: '', value: 0 }
  }

  setPropertyValue(key: SourcePropKey, value: TObsValue) {
    const prop = this.properties.find(a => a.name === key)
    if (!prop || prop.value === value) return // no need change
    prop.value = value
    const source = this.sourcesService.getSource(this.sourceId);
    source.setPropertiesFormData([prop]);

    console.log(`set property ${key} ${value}`)
    this.tainted = true // restote on cancel 
  }

  // --- rutine

  update() {
    const p: StateParam = {
      currentIndex: this.currentIndex,
      manuals: this.manuals
    }

    this.rtvcStateService.setValue(p)
  }


  // -- vue lifecycle

  created() {
    // SourceProperties.mountedで取得するが、リストなど間に合わないので先にこれだけ
    this.properties = this.source ? this.source.getPropertiesFormData() : [];

    const audio = this.audioService.getSource(this.sourceId)
    if (audio) {
      const m = audio.monitoringType
      this.initialMonitoringType = m
      this.isMonitor = m !== obs.EMonitoringType.None
    }
    this.device = this.getPropertyValue('device')

    // default values
    this.manuals = [{ name: 'オリジナル1', pitchShift: 0, amount: 0, primaryVoice: 0, secondaryVoice: -1 },
    { name: 'オリジナル2', pitchShift: 0, amount: 0, primaryVoice: 0, secondaryVoice: -1 },
    { name: 'オリジナル3', pitchShift: 0, amount: 0, primaryVoice: 0, secondaryVoice: -1 }]

    const p = this.rtvcStateService.getValue() as StateParam

    if (Array.isArray(p.manuals)) this.manuals = p.manuals
    this.updateManualList()

    this.currentIndex = p.currentIndex ?? 'preset/0'
    this.onChangeIndex()
  }

  // 右上xではOKという感じらしい
  beforeDestroy() {
    if (this.canceled) {
      if (this.tainted) {
        const source = this.sourcesService.getSource(this.sourceId);
        source.setPropertiesFormData(this.initialProperties);
      }
      return
    }

    // non-cancel
    this.update()
  }

  // --- event

  done() {
    this.closeWindow()
  }
  cancel() {
    this.canceled = true
    this.closeWindow()
  }

  onSelect(index: string) {
    this.currentIndex = index
  }

  onAdd() {
    if (this.manuals.length >= this.manualMax) return
    const index = 'manual/' + (this.manuals.length)
    this.manuals.push(
      { name: `オリジナル${this.manuals.length + 1}`, pitchShift: 0, amount: 0, primaryVoice: 0, secondaryVoice: -1 },
    )
    this.updateManualList()
    this.currentIndex = index
  }

  onDelete(index: string) {
    const idx = this.getManualIndexNum(index)
    if (idx < 0) return
    this.manuals.splice(idx, 1)
    this.updateManualList()
    if (index !== this.currentIndex) return
    this.currentIndex = 'preset/0'
  }

  onCopy(index: string) {
    if (this.manuals.length >= this.manualMax) return
    const idx = this.getManualIndexNum(index)
    if (idx < 0) return
    const v = this.manuals[idx]
    const newIndex = 'manual/' + (this.manuals.length)

    this.manuals.push(
      { name: v.name + 'のコピー', pitchShift: v.pitchShift, amount: v.amount, primaryVoice: v.primaryVoice, secondaryVoice: v.secondaryVoice },
    )

    this.updateManualList()
    this.currentIndex = newIndex
  }

}

/*[
  {
    description: "Input",
    enabled: true,
    name: "device",
    options: [
      {
        description: "device 0",
        value: 0,
      },
      {
        description: "device 1",
        value: 1,
      },
      {
        description: "device 2",
        value: 2,
      },
    ],
    type: "OBS_PROPERTY_LIST",
    value: 0,
    visible: true,
  },
  {
    description: "Input Gain",
    enabled: true,
    maxVal: 6,
    minVal: -6,
    name: "input_gain",
    stepVal: 0.01,
    type: "OBS_PROPERTY_SLIDER",
    value: 0,
    visible: true,
  },
  {
    description: "Output Gain",
    enabled: true,
    maxVal: 6,
    minVal: -6,
    name: "output_gain",
    stepVal: 0.01,
    type: "OBS_PROPERTY_SLIDER",
    value: 0,
    visible: true,
  },
  {
    description: "Pitch Shift",
    enabled: true,
    maxVal: 1200,
    minVal: -1200,
    name: "pitch_shift",
    stepVal: 1,
    type: "OBS_PROPERTY_SLIDER",
    value: 0,
    visible: true,
  },
  {
    description: "Pitch Shift Mode",
    enabled: true,
    name: "pitch_shift_mode",
    options: [
      {
        description: "song",
        value: 0,
      },
      {
        description: "talk",
        value: 1,
      },
    ],
    type: "OBS_PROPERTY_LIST",
    value: 1,
    visible: true,
  },
  {
    description: "Pitch Snap",
    enabled: true,
    maxVal: 100,
    minVal: 0,
    name: "pitch_snap",
    stepVal: 1,
    type: "OBS_PROPERTY_SLIDER",
    value: 0,
    visible: true,
  },
  {
    description: "Primary Voice",
    enabled: true,
    name: "primary_voice",
    options: [
      {
        description: "voice 0",
        value: 0,
      },
      {
        description: "voice 1",
        value: 1,
      },
      {
        description: "voice 2",
        value: 2,
      },
      {
        description: "voice 3",
        value: 3,
      },
      {
        description: "voice 4",
        value: 4,
      },
      {
        description: "voice 5",
        value: 5,
      },
      {
        description: "voice 6",
        value: 6,
      },
      {
        description: "voice 7",
        value: 7,
      },
      {
        description: "voice 8",
        value: 8,
      },
      {
        description: "voice 9",
        value: 9,
      },
    ],
    type: "OBS_PROPERTY_LIST",
    value: 100,
    visible: true,
  },
  {
    description: "Secondary Voice",
    enabled: true,
    name: "secondary_voice",
    options: [
      {
        description: "none",
        value: -1,
      },
      {
        description: "voice 0",
        value: 0,
      },
      {
        description: "voice 1",
        value: 1,
      },
      {
        description: "voice 2",
        value: 2,
      },
      {
        description: "voice 3",
        value: 3,
      },
      {
        description: "voice 4",
        value: 4,
      },
      {
        description: "voice 5",
        value: 5,
      },
      {
        description: "voice 6",
        value: 6,
      },
      {
        description: "voice 7",
        value: 7,
      },
      {
        description: "voice 8",
        value: 8,
      },
      {
        description: "voice 9",
        value: 9,
      },
    ],
    type: "OBS_PROPERTY_LIST",
    value: -1,
    visible: true,
  },
  {
    description: "Amount",
    enabled: true,
    maxVal: 100,
    minVal: 0,
    name: "amount",
    stepVal: 1,
    type: "OBS_PROPERTY_SLIDER",
    value: 0,
    visible: true,
  },
]*/
