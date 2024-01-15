import { Component, Watch } from 'vue-property-decorator';
import SourceProperties from './SourceProperties.vue';
import { RtvcStateService } from 'app-services';
import { Inject } from 'services/core/injector';
import VueSlider from 'vue-slider-component';
import Multiselect from 'vue-multiselect';
import { AudioService } from '../../services/audio'
import * as obs from '../../../obs-api';
import { IObsListInput, IObsListOption, TObsValue } from 'components/obs/inputs/ObsInput';

// for source properties
type SourcePropKey = 'device' | 'latency' | 'input_gain' | 'output_gain' | 'pitch_shift' | 'pitch_shift_mode' | 'pitch_snap' | 'primary_voice' | 'secondary_voice' | 'amount'

// for save params
type ParamKey = 'name' | 'inputGain' | 'pitchShift' | 'amount' | 'primaryVoice' | 'secondaryVoice';

interface CommonParam {
    name: string
    image: string
    icon: string

    pitchShift: number
    amount: number
    primaryVoice: number
    secondaryVoice: number
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
        { index: 'preset/0', name: "琴詠ニア", image: "preset-bg0", icon: "icon-0", pitchShift: 0, primaryVoice: 100, secondaryVoice: -1, amount: 0 },
        { index: 'preset/1', name: "ずんだもん", image: "preset-bg1", icon: "icon-0", pitchShift: 0, primaryVoice: 101, secondaryVoice: -1, amount: 0 },
        { index: 'preset/2', name: "春日部つむぎ", image: "preset-bg2", icon: "icon-0", pitchShift: 0, primaryVoice: 102, secondaryVoice: -1, amount: 0 },
        //仮値 "../../../media/images/nvoice.png" だがvueがpath変換するので
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

    primaryVoiceModel: IObsListOption<number> = { description: '', value: 0 }
    secondaryVoiceModel: IObsListOption<number> = { description: '', value: 0 }
    deviceModel: IObsListOption<number> = { description: '', value: 0 }
    latencyModel: IObsListOption<number> = { description: '', value: 0 }

    get presetList() { return this.presetValues.map(a => { return { value: a.index, name: a.name, icon: a.icon } }) }
    manualList: { value: string, name: string, icon: string }[] = []
    updateManualList() {
        // add,delに反応しないのでコード側から変更指示
        this.manualList = this.manualParams.map((a, idx) => { return { value: `manual/${idx}`, name: a.name, icon: "icon-0" } })
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

    getParams(): CommonParam {
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
        // SourceProperties.mountedで取得するが、リストなど間に合わないので先にこれだけ。該当ソースの各パラメタはpropertiesを見れば分かる
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

        // モニタリング状態は元の値に戻す
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
        const list0 = this.primaryVoiceList
        const idx0 = Math.floor(Math.random() * list0.length)
        this.primaryVoiceModel = list0[idx0]

        const list1 = this.primaryVoiceList
        const idx1 = Math.floor(Math.random() * list1.length)
        this.secondaryVoiceModel= list1[idx1]

        this.amount = Math.floor(Math.random() * 50)
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

