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
type SourcePropKey = 'device' | 'latency' | 'input_gain' | 'output_gain' | 'pitch_shift' | 'pitch_shift_mode' | 'pitch_snap' | 'primary_voice' | 'secondary_voice' | 'amount'

type ParamKey = 'name' | 'inputGain' | 'pitchShift' | 'amount' | 'primaryVoice' | 'secondaryVoice';

interface Param {
  name: string
  image: string
  icon: string

  pitchShift: number
  amount: number
  primaryVoice: number
  secondaryVoice: number

  // inputGain: number
  // pitchShiftMode
}

// RtvcStateService保持用
interface ManualParam {
  name: string
  pitchShift: number
  amount: number
  primaryVoice: number
  secondaryVoice: number
}

interface PresetParam {
  pitchShift: number
}

interface StateParam {
  currentIndex: string
  manuals: ManualParam[]
  presets: PresetParam[]
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

  advancedSettingsTooltip = 'audio.advancedSettingsTooltip';

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
  currentMonitoringType: obs.EMonitoringType

  manualParams: ManualParam[]
  presetParams: PresetParam[]

  currentIndex: string = "preset/0"
  isMonitor: boolean = false
  canceled = false

  name = ""
  image = ""
  device: TObsValue = 0
  latency: TObsValue = 0

  primaryVoice: TObsValue = 0
  secondaryVoice: TObsValue = 0
  pitchShift: TObsValue = 0
  amount: TObsValue = 0

  tab = 0
  canAdd = false

  // v-modelが {} での値で更新されるので噛ませる
  primaryVoiceModel: IObsListOption<number> = { description: '', value: 0 }
  secondaryVoiceModel: IObsListOption<number> = { description: '', value: 0 }
  deviceModel: IObsListOption<number> = { description: '', value: 0 }
  latencyModel: IObsListOption<number> = { description: '', value: 0 }

  get presetList() { return this.presetValues.map(a => { return { value: a.index, name: a.name, icon: a.icon } }) }
  manualList: { value: string, name: string, icon: string }[] = []
  updateManualList() {
    // add,delに反応しないのでコード側から変更指示
    this.manualList = this.manualParams.map((a, idx) => { return { value: `manual/${idx}`, name: a.name, icon: "./media/images/test_icon.png" } })
    this.canAdd = this.manualList.length < this.manualMax
  }

  // マニュアル操作で選べないvoice
  // value,description (indexはsecondaryなどでずれるのでvalueでチェックすること)
  // 100 kotoyomi_nia
  // 101 zundamon
  // 103 kasukabe_tsumugi
  readonly nonManualVoiceValues = [100, 101, 102]

  get primaryVoiceList() { return this.getPropertyOptions('primary_voice').filter(a => !this.nonManualVoiceValues.includes(a.value)) }
  get secondaryVoiceList() { return this.getPropertyOptions('secondary_voice').filter(a => !this.nonManualVoiceValues.includes(a.value)) }
  get deviceList() { return this.getPropertyOptions('device') }
  get latencyList() { return this.getPropertyOptions('latency') }

  get isPreset() {
    if (!this.currentIndex) return false
    return this.currentIndex.includes('preset')
  }

  @Watch('currentIndex')
  onChangeIndex() {
    const p = this.getParams()

    this.name = p.name
    this.image = p.image

    this.pitchShift = p.pitchShift
    this.amount = p.amount
    this.primaryVoice = p.primaryVoice
    this.secondaryVoice = p.secondaryVoice

    this.primaryVoiceModel = this.getPropertyOptionByValue('primary_voice', this.primaryVoice)
    this.secondaryVoiceModel = this.getPropertyOptionByValue('secondary_voice', this.secondaryVoice)
    this.deviceModel = this.getPropertyOptionByValue('device', this.device)
    this.latencyModel = this.getPropertyOptionByValue('latency', this.latency)

    // sourcesへも反映
    this.setPropertyValue('pitch_shift', this.pitchShift)
    this.setPropertyValue('amount', this.amount)
    this.setPropertyValue('primary_voice', this.primaryVoice)
    this.setPropertyValue('secondary_voice', this.secondaryVoice)
  }

  @Watch('name')
  onChangeName() {
    this.setParam('name', this.name)
    const idx = this.getManualIndexNum(this.currentIndex)
    if (idx >= 0) this.manualList[idx].name = this.name // 画面反映
  }

  @Watch('pitchShift')
  onChangePitchShift() {
    this.setParam('pitchShift', this.pitchShift)
    this.setPropertyValue('pitch_shift', this.pitchShift)
  }

  @Watch('amount')
  onChangeAmount() {
    this.setParam('amount', this.amount)
    this.setPropertyValue('amount', this.amount)
  }

  @Watch('primaryVoiceModel')
  onChangePrimaryVoice() {
    this.primaryVoice = this.primaryVoiceModel.value
    this.setParam('primaryVoice', this.primaryVoice)
    this.setPropertyValue('primary_voice', this.primaryVoice)
  }

  @Watch('secondaryVoiceModel')
  onChangeSecondaryVoice() {
    this.secondaryVoice = this.secondaryVoiceModel.value
    this.setParam('secondaryVoice', this.secondaryVoice)
    this.setPropertyValue('secondary_voice', this.secondaryVoice)
  }

  @Watch('deviceModel')
  onChangeDevice() {
    this.device = this.deviceModel.value
    this.setPropertyValue('device', this.device)
  }

  @Watch('latencyModel')
  onChangeLatency() {
    this.latency = this.latencyModel.value
    this.setPropertyValue('latency', this.latency)
  }

  @Watch('isMonitor')
  onChangeMonitor() {
    // on値は踏襲かoffならmonitor only, offはNoneでよい
    const onValue = this.initialMonitoringType !== obs.EMonitoringType.None ? this.initialMonitoringType : obs.EMonitoringType.MonitoringOnly
    const monitoringType = this.isMonitor ? onValue : obs.EMonitoringType.None
    this.audioService.setSettings(this.sourceId, { monitoringType })
    this.currentMonitoringType = monitoringType
  }

  // --  param in/out

  getParams(): Param {
    const p = this.indexToNum(this.currentIndex)
    if (p.isManual) {
      const v = this.manualParams[p.idx]
      return {
        name: v.name, icon: '', image: '',
        pitchShift: v.pitchShift,
        amount: v.amount,
        primaryVoice: v.primaryVoice,
        secondaryVoice: v.secondaryVoice
      }
    }

    const v = this.presetValues[p.idx]
    const m = this.presetParams[p.idx]

    return {
      name: '', icon: v.icon, image: v.image,
      pitchShift: m.pitchShift,
      amount: v.amount,
      primaryVoice: v.primaryVoice,
      secondaryVoice: v.secondaryVoice
    }
  }

  setParam(key: ParamKey, value: any) {
    const p = this.indexToNum(this.currentIndex)
    if (p.isManual) {
      this.manualParams[p.idx][key] = value
      return
    }
    this.presetParams[p.idx][key] = value
  }

  indexToNum(index: string): { isManual: boolean, idx: number } {
    const s = index.split('/')
    if (s.length === 2) {
      const num = Number(s[1])
      if (s[0] === 'manual' && num >= 0 && num < this.manualParams.length) return { isManual: true, idx: num }
      if (s[0] === 'preset' && num >= 0 && num < this.presetList.length) return { isManual: false, idx: num }
    }
    return { isManual: false, idx: 0 }
  }

  getManualIndexNum(index: string): number {
    const r = this.indexToNum(index)
    if (r.isManual) return r.idx
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
    this.tainted = true // restote on cancel 
  }

  // --- update

  update() {
    const p: StateParam = {
      currentIndex: this.currentIndex,
      manuals: this.manualParams,
      presets: this.presetParams
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
      this.currentMonitoringType = m
      this.isMonitor = m !== obs.EMonitoringType.None
    }
    this.device = this.getPropertyValue('device')
    this.latency = this.getPropertyValue('latency')

    const p = this.rtvcStateService.getValue() as StateParam

    this.presetParams = []
    if (Array.isArray(p.presets)) this.presetParams = p.presets
    while (this.presetParams.length < this.presetValues.length) this.presetParams.push({ pitchShift: 0 })

    // default values
    this.manualParams = [
      { name: 'オリジナル1', pitchShift: 0, amount: 0, primaryVoice: 0, secondaryVoice: -1 },
      { name: 'オリジナル2', pitchShift: 0, amount: 0, primaryVoice: 0, secondaryVoice: -1 },
      { name: 'オリジナル3', pitchShift: 0, amount: 0, primaryVoice: 0, secondaryVoice: -1 }
    ]

    if (Array.isArray(p.manuals)) this.manualParams = p.manuals
    this.updateManualList()

    this.currentIndex = p.currentIndex ?? 'preset/0'
    this.onChangeIndex()
  }

  // 右上xではOKという感じらしい
  beforeDestroy() {

    // モニタリング状態はもとの値に戻す
    if (this.initialMonitoringType !== this.currentMonitoringType)
      this.audioService.setSettings(this.sourceId, { monitoringType: this.initialMonitoringType })

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

  onRandom() {
    const list = this.primaryVoiceList
    const idx = Math.floor(Math.random() * list.length)
    this.primaryVoiceModel = list[idx]
    this.secondaryVoiceModel = this.secondaryVoiceList[0]
    this.amount = 0
  }

  onTab(idx: number) {
    this.tab = idx
  }

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
    if (this.manualParams.length >= this.manualMax) return
    const index = `manual/${this.manualParams.length}`
    this.manualParams.push(
      { name: `オリジナル${this.manualParams.length + 1}`, pitchShift: 0, amount: 0, primaryVoice: 0, secondaryVoice: -1 },
    )
    this.updateManualList()
    this.currentIndex = index
  }

  onDelete(index: string) {
    const idx = this.getManualIndexNum(index)
    if (idx < 0) return
    if (!confirm("削除しますか？")) return

    this.manualParams.splice(idx, 1)
    this.updateManualList()
    if (index !== this.currentIndex) return
    this.currentIndex = 'preset/0'
  }

  onCopy(index: string) {
    if (this.manualParams.length >= this.manualMax) return
    const idx = this.getManualIndexNum(index)
    if (idx < 0) return
    const v = this.manualParams[idx]
    const newIndex = `manual/${this.manualParams.length}`

    this.manualParams.push(
      { name: `${v.name}のコピー`, pitchShift: v.pitchShift, amount: v.amount, primaryVoice: v.primaryVoice, secondaryVoice: v.secondaryVoice },
    )

    this.updateManualList()
    this.currentIndex = newIndex
  }

}

/*
[
    {
        "description": "Input",
        "enabled": true,
        "name": "device",
        "options": [
            {
                "description": "リモート オーディオ",
                "value": 0
            }
        ],
        "type": "OBS_PROPERTY_LIST",
        "value": 4,
        "visible": true
    },
    {
        "description": "Latency",
        "enabled": true,
        "name": "latency",
        "options": [
            {
                "description": "minimum-latency",
                "value": 1
            },
            {
                "description": "ultra_low-latency",
                "value": 2
            },
            {
                "description": "hyper_low-latency",
                "value": 3
            },
            {
                "description": "super_low-latency",
                "value": 4
            },
            {
                "description": "very_low-latency",
                "value": 5
            },
            {
                "description": "low-latency",
                "value": 6
            },
            {
                "description": "middle-latency",
                "value": 7
            },
            {
                "description": "high-latency",
                "value": 8
            },
            {
                "description": "very_high-latency",
                "value": 9
            },
            {
                "description": "super_high-latency",
                "value": 10
            },
            {
                "description": "hyper_high-latency",
                "value": 11
            },
            {
                "description": "ultra_high-latency",
                "value": 12
            },
            {
                "description": "maximum-latency",
                "value": 13
            }
        ],
        "type": "OBS_PROPERTY_LIST",
        "value": 7,
        "visible": true
    },
    {
        "description": "Input Gain",
        "enabled": true,
        "maxVal": 6,
        "minVal": -6,
        "name": "input_gain",
        "stepVal": 0.01,
        "type": "OBS_PROPERTY_SLIDER",
        "value": 0,
        "visible": true
    },
    {
        "description": "Output Gain",
        "enabled": true,
        "maxVal": 6,
        "minVal": -6,
        "name": "output_gain",
        "stepVal": 0.01,
        "type": "OBS_PROPERTY_SLIDER",
        "value": 0,
        "visible": true
    },
    {
        "description": "Pitch Shift",
        "enabled": true,
        "maxVal": 1200,
        "minVal": -1200,
        "name": "pitch_shift",
        "stepVal": 1,
        "type": "OBS_PROPERTY_SLIDER",
        "value": 0,
        "visible": true
    },
    {
        "description": "Pitch Shift Mode",
        "enabled": true,
        "name": "pitch_shift_mode",
        "options": [
            {
                "description": "song",
                "value": 0
            },
            {
                "description": "talk",
                "value": 1
            }
        ],
        "type": "OBS_PROPERTY_LIST",
        "value": 1,
        "visible": true
    },
    {
        "description": "Pitch Snap",
        "enabled": true,
        "maxVal": 100,
        "minVal": 0,
        "name": "pitch_snap",
        "stepVal": 1,
        "type": "OBS_PROPERTY_SLIDER",
        "value": 0,
        "visible": true
    },
    {
        "description": "Primary Voice",
        "enabled": true,
        "name": "primary_voice",
        "options": [
            {
                "description": "jvs_001",
                "value": 0
            },
            {
                "description": "jvs_002",
                "value": 1
            },
            {
                "description": "jvs_003",
                "value": 2
            },
            {
                "description": "jvs_004",
                "value": 3
            },
            {
                "description": "jvs_005",
                "value": 4
            },
            {
                "description": "jvs_006",
                "value": 5
            },
            {
                "description": "jvs_007",
                "value": 6
            },
            {
                "description": "jvs_008",
                "value": 7
            },
            {
                "description": "jvs_009",
                "value": 8
            },
            {
                "description": "jvs_010",
                "value": 9
            },
            {
                "description": "jvs_011",
                "value": 10
            },
            {
                "description": "jvs_012",
                "value": 11
            },
            {
                "description": "jvs_013",
                "value": 12
            },
            {
                "description": "jvs_014",
                "value": 13
            },
            {
                "description": "jvs_015",
                "value": 14
            },
            {
                "description": "jvs_016",
                "value": 15
            },
            {
                "description": "jvs_017",
                "value": 16
            },
            {
                "description": "jvs_018",
                "value": 17
            },
            {
                "description": "jvs_019",
                "value": 18
            },
            {
                "description": "jvs_020",
                "value": 19
            },
            {
                "description": "jvs_021",
                "value": 20
            },
            {
                "description": "jvs_022",
                "value": 21
            },
            {
                "description": "jvs_023",
                "value": 22
            },
            {
                "description": "jvs_024",
                "value": 23
            },
            {
                "description": "jvs_025",
                "value": 24
            },
            {
                "description": "jvs_026",
                "value": 25
            },
            {
                "description": "jvs_027",
                "value": 26
            },
            {
                "description": "jvs_028",
                "value": 27
            },
            {
                "description": "jvs_029",
                "value": 28
            },
            {
                "description": "jvs_030",
                "value": 29
            },
            {
                "description": "jvs_031",
                "value": 30
            },
            {
                "description": "jvs_032",
                "value": 31
            },
            {
                "description": "jvs_033",
                "value": 32
            },
            {
                "description": "jvs_034",
                "value": 33
            },
            {
                "description": "jvs_035",
                "value": 34
            },
            {
                "description": "jvs_036",
                "value": 35
            },
            {
                "description": "jvs_037",
                "value": 36
            },
            {
                "description": "jvs_038",
                "value": 37
            },
            {
                "description": "jvs_039",
                "value": 38
            },
            {
                "description": "jvs_040",
                "value": 39
            },
            {
                "description": "jvs_041",
                "value": 40
            },
            {
                "description": "jvs_042",
                "value": 41
            },
            {
                "description": "jvs_043",
                "value": 42
            },
            {
                "description": "jvs_044",
                "value": 43
            },
            {
                "description": "jvs_045",
                "value": 44
            },
            {
                "description": "jvs_046",
                "value": 45
            },
            {
                "description": "jvs_047",
                "value": 46
            },
            {
                "description": "jvs_048",
                "value": 47
            },
            {
                "description": "jvs_049",
                "value": 48
            },
            {
                "description": "jvs_050",
                "value": 49
            },
            {
                "description": "jvs_051",
                "value": 50
            },
            {
                "description": "jvs_052",
                "value": 51
            },
            {
                "description": "jvs_053",
                "value": 52
            },
            {
                "description": "jvs_054",
                "value": 53
            },
            {
                "description": "jvs_055",
                "value": 54
            },
            {
                "description": "jvs_056",
                "value": 55
            },
            {
                "description": "jvs_057",
                "value": 56
            },
            {
                "description": "jvs_058",
                "value": 57
            },
            {
                "description": "jvs_059",
                "value": 58
            },
            {
                "description": "jvs_060",
                "value": 59
            },
            {
                "description": "jvs_061",
                "value": 60
            },
            {
                "description": "jvs_062",
                "value": 61
            },
            {
                "description": "jvs_063",
                "value": 62
            },
            {
                "description": "jvs_064",
                "value": 63
            },
            {
                "description": "jvs_065",
                "value": 64
            },
            {
                "description": "jvs_066",
                "value": 65
            },
            {
                "description": "jvs_067",
                "value": 66
            },
            {
                "description": "jvs_068",
                "value": 67
            },
            {
                "description": "jvs_069",
                "value": 68
            },
            {
                "description": "jvs_070",
                "value": 69
            },
            {
                "description": "jvs_071",
                "value": 70
            },
            {
                "description": "jvs_072",
                "value": 71
            },
            {
                "description": "jvs_073",
                "value": 72
            },
            {
                "description": "jvs_074",
                "value": 73
            },
            {
                "description": "jvs_075",
                "value": 74
            },
            {
                "description": "jvs_076",
                "value": 75
            },
            {
                "description": "jvs_077",
                "value": 76
            },
            {
                "description": "jvs_078",
                "value": 77
            },
            {
                "description": "jvs_079",
                "value": 78
            },
            {
                "description": "jvs_080",
                "value": 79
            },
            {
                "description": "jvs_081",
                "value": 80
            },
            {
                "description": "jvs_082",
                "value": 81
            },
            {
                "description": "jvs_083",
                "value": 82
            },
            {
                "description": "jvs_084",
                "value": 83
            },
            {
                "description": "jvs_085",
                "value": 84
            },
            {
                "description": "jvs_086",
                "value": 85
            },
            {
                "description": "jvs_087",
                "value": 86
            },
            {
                "description": "jvs_088",
                "value": 87
            },
            {
                "description": "jvs_089",
                "value": 88
            },
            {
                "description": "jvs_090",
                "value": 89
            },
            {
                "description": "jvs_091",
                "value": 90
            },
            {
                "description": "jvs_092",
                "value": 91
            },
            {
                "description": "jvs_093",
                "value": 92
            },
            {
                "description": "jvs_094",
                "value": 93
            },
            {
                "description": "jvs_095",
                "value": 94
            },
            {
                "description": "jvs_096",
                "value": 95
            },
            {
                "description": "jvs_097",
                "value": 96
            },
            {
                "description": "jvs_098",
                "value": 97
            },
            {
                "description": "jvs_099",
                "value": 98
            },
            {
                "description": "jvs_100",
                "value": 99
            },
            {
                "description": "kotoyomi_nia",
                "value": 100
            },
            {
                "description": "zundamon",
                "value": 101
            },
            {
                "description": "kasukabe_tsumugi",
                "value": 102
            }
        ],
        "type": "OBS_PROPERTY_LIST",
        "value": 0,
        "visible": true
    },
    {
        "description": "Secondary Voice",
        "enabled": true,
        "name": "secondary_voice",
        "options": [
            {
                "description": "none",
                "value": -1
            },
            {
                "description": "jvs_001",
                "value": 0
            },
            {
                "description": "jvs_002",
                "value": 1
            },
            {
                "description": "jvs_003",
                "value": 2
            },
            {
                "description": "jvs_004",
                "value": 3
            },
            {
                "description": "jvs_005",
                "value": 4
            },
            {
                "description": "jvs_006",
                "value": 5
            },
            {
                "description": "jvs_007",
                "value": 6
            },
            {
                "description": "jvs_008",
                "value": 7
            },
            {
                "description": "jvs_009",
                "value": 8
            },
            {
                "description": "jvs_010",
                "value": 9
            },
            {
                "description": "jvs_011",
                "value": 10
            },
            {
                "description": "jvs_012",
                "value": 11
            },
            {
                "description": "jvs_013",
                "value": 12
            },
            {
                "description": "jvs_014",
                "value": 13
            },
            {
                "description": "jvs_015",
                "value": 14
            },
            {
                "description": "jvs_016",
                "value": 15
            },
            {
                "description": "jvs_017",
                "value": 16
            },
            {
                "description": "jvs_018",
                "value": 17
            },
            {
                "description": "jvs_019",
                "value": 18
            },
            {
                "description": "jvs_020",
                "value": 19
            },
            {
                "description": "jvs_021",
                "value": 20
            },
            {
                "description": "jvs_022",
                "value": 21
            },
            {
                "description": "jvs_023",
                "value": 22
            },
            {
                "description": "jvs_024",
                "value": 23
            },
            {
                "description": "jvs_025",
                "value": 24
            },
            {
                "description": "jvs_026",
                "value": 25
            },
            {
                "description": "jvs_027",
                "value": 26
            },
            {
                "description": "jvs_028",
                "value": 27
            },
            {
                "description": "jvs_029",
                "value": 28
            },
            {
                "description": "jvs_030",
                "value": 29
            },
            {
                "description": "jvs_031",
                "value": 30
            },
            {
                "description": "jvs_032",
                "value": 31
            },
            {
                "description": "jvs_033",
                "value": 32
            },
            {
                "description": "jvs_034",
                "value": 33
            },
            {
                "description": "jvs_035",
                "value": 34
            },
            {
                "description": "jvs_036",
                "value": 35
            },
            {
                "description": "jvs_037",
                "value": 36
            },
            {
                "description": "jvs_038",
                "value": 37
            },
            {
                "description": "jvs_039",
                "value": 38
            },
            {
                "description": "jvs_040",
                "value": 39
            },
            {
                "description": "jvs_041",
                "value": 40
            },
            {
                "description": "jvs_042",
                "value": 41
            },
            {
                "description": "jvs_043",
                "value": 42
            },
            {
                "description": "jvs_044",
                "value": 43
            },
            {
                "description": "jvs_045",
                "value": 44
            },
            {
                "description": "jvs_046",
                "value": 45
            },
            {
                "description": "jvs_047",
                "value": 46
            },
            {
                "description": "jvs_048",
                "value": 47
            },
            {
                "description": "jvs_049",
                "value": 48
            },
            {
                "description": "jvs_050",
                "value": 49
            },
            {
                "description": "jvs_051",
                "value": 50
            },
            {
                "description": "jvs_052",
                "value": 51
            },
            {
                "description": "jvs_053",
                "value": 52
            },
            {
                "description": "jvs_054",
                "value": 53
            },
            {
                "description": "jvs_055",
                "value": 54
            },
            {
                "description": "jvs_056",
                "value": 55
            },
            {
                "description": "jvs_057",
                "value": 56
            },
            {
                "description": "jvs_058",
                "value": 57
            },
            {
                "description": "jvs_059",
                "value": 58
            },
            {
                "description": "jvs_060",
                "value": 59
            },
            {
                "description": "jvs_061",
                "value": 60
            },
            {
                "description": "jvs_062",
                "value": 61
            },
            {
                "description": "jvs_063",
                "value": 62
            },
            {
                "description": "jvs_064",
                "value": 63
            },
            {
                "description": "jvs_065",
                "value": 64
            },
            {
                "description": "jvs_066",
                "value": 65
            },
            {
                "description": "jvs_067",
                "value": 66
            },
            {
                "description": "jvs_068",
                "value": 67
            },
            {
                "description": "jvs_069",
                "value": 68
            },
            {
                "description": "jvs_070",
                "value": 69
            },
            {
                "description": "jvs_071",
                "value": 70
            },
            {
                "description": "jvs_072",
                "value": 71
            },
            {
                "description": "jvs_073",
                "value": 72
            },
            {
                "description": "jvs_074",
                "value": 73
            },
            {
                "description": "jvs_075",
                "value": 74
            },
            {
                "description": "jvs_076",
                "value": 75
            },
            {
                "description": "jvs_077",
                "value": 76
            },
            {
                "description": "jvs_078",
                "value": 77
            },
            {
                "description": "jvs_079",
                "value": 78
            },
            {
                "description": "jvs_080",
                "value": 79
            },
            {
                "description": "jvs_081",
                "value": 80
            },
            {
                "description": "jvs_082",
                "value": 81
            },
            {
                "description": "jvs_083",
                "value": 82
            },
            {
                "description": "jvs_084",
                "value": 83
            },
            {
                "description": "jvs_085",
                "value": 84
            },
            {
                "description": "jvs_086",
                "value": 85
            },
            {
                "description": "jvs_087",
                "value": 86
            },
            {
                "description": "jvs_088",
                "value": 87
            },
            {
                "description": "jvs_089",
                "value": 88
            },
            {
                "description": "jvs_090",
                "value": 89
            },
            {
                "description": "jvs_091",
                "value": 90
            },
            {
                "description": "jvs_092",
                "value": 91
            },
            {
                "description": "jvs_093",
                "value": 92
            },
            {
                "description": "jvs_094",
                "value": 93
            },
            {
                "description": "jvs_095",
                "value": 94
            },
            {
                "description": "jvs_096",
                "value": 95
            },
            {
                "description": "jvs_097",
                "value": 96
            },
            {
                "description": "jvs_098",
                "value": 97
            },
            {
                "description": "jvs_099",
                "value": 98
            },
            {
                "description": "jvs_100",
                "value": 99
            },
            {
                "description": "kotoyomi_nia",
                "value": 100
            },
            {
                "description": "zundamon",
                "value": 101
            },
            {
                "description": "kasukabe_tsumugi",
                "value": 102
            }
        ],
        "type": "OBS_PROPERTY_LIST",
        "value": -1,
        "visible": true
    },
    {
        "description": "Amount",
        "enabled": true,
        "maxVal": 100,
        "minVal": 0,
        "name": "amount",
        "stepVal": 1,
        "type": "OBS_PROPERTY_SLIDER",
        "value": 0,
        "visible": true
    }
]
*/