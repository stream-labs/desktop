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

    readonly manualMax = 5

    readonly presetValues = [
        { index: 'preset/0', name: "琴詠ニア", image: "preset-bg0", icon: "icon-0", pitchShift: 0, primaryVoice: 100, secondaryVoice: -1, amount: 0 },
        { index: 'preset/1', name: "ずんだもん", image: "preset-bg1", icon: "icon-0", pitchShift: 0, primaryVoice: 101, secondaryVoice: -1, amount: 0 },
        { index: 'preset/2', name: "春日部つむぎ", image: "preset-bg2", icon: "icon-0", pitchShift: 0, primaryVoice: 102, secondaryVoice: -1, amount: 0 },
        //仮値 css での宣言値で
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

    get primaryVoiceList() {
        return jvsList
        //return this.getPropertyOptions('primary_voice').filter(a => !this.nonManualVoiceValues.includes(a.value))
    }
    get secondaryVoiceList() {
        return [{ description: 'なし', value: -1 }, ...jvsList]
        //return this.getPropertyOptions('secondary_voice').filter(a => !this.nonManualVoiceValues.includes(a.value))
    }
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

        const optionInList = (list: IObsListOption<number>[], value: number, def: number) => list.find(a => a.value === value) ?? list[def]

        this.primaryVoiceModel = optionInList(this.primaryVoiceList, this.primaryVoice, 0)//this.getPropertyOptionByValue('primary_voice', this.primaryVoice)
        this.secondaryVoiceModel = optionInList(this.secondaryVoiceList, this.secondaryVoice, -1)//this.getPropertyOptionByValue('secondary_voice', this.secondaryVoice)
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
        this.secondaryVoiceModel = list1[idx1]

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

const jvsList = [
    { description: "男性/低め/1  jvs006", value: 5 },
    { description: "男性/低め/2  jvs021", value: 20 },
    { description: "男性/低め/3  jvs042", value: 41 },
    { description: "男性/低め/4  jvs078", value: 77 },
    { description: "男性/低め/5  jvs071", value: 70 },
    { description: "男性/低め/6  jvs009", value: 8 },
    { description: "男性/低め/7  jvs012", value: 11 },
    { description: "男性/低め/8  jvs037", value: 36 },
    { description: "男性/低め/9  jvs044", value: 43 },
    { description: "男性/低め/10  jvs048", value: 47 },
    { description: "男性/低め/11  jvs079", value: 78 },
    { description: "男性/低め/12  jvs089", value: 88 },
    { description: "男性/低め/13  jvs100", value: 99 },
    { description: "男性/普通/1  jvs022", value: 21 },
    { description: "男性/普通/2  jvs033", value: 32 },
    { description: "男性/普通/3  jvs034", value: 33 },
    { description: "男性/普通/4  jvs049", value: 48 },
    { description: "男性/普通/5  jvs081", value: 80 },
    { description: "男性/普通/6  jvs023", value: 22 },
    { description: "男性/普通/7  jvs068", value: 67 },
    { description: "男性/普通/8  jvs088", value: 87 },
    { description: "男性/普通/9  jvs003", value: 2 },
    { description: "男性/普通/10  jvs020", value: 19 },
    { description: "男性/普通/11  jvs028", value: 27 },
    { description: "男性/普通/12  jvs045", value: 44 },
    { description: "男性/普通/13  jvs073", value: 72 },
    { description: "男性/普通/14  jvs074", value: 73 },
    { description: "男性/普通/15  jvs077", value: 76 },
    { description: "男性/普通/16  jvs005", value: 4 },
    { description: "男性/高め/1  jvs013", value: 12 },
    { description: "男性/高め/2  jvs031", value: 30 },
    { description: "男性/高め/3  jvs046", value: 45 },
    { description: "男性/高め/4  jvs070", value: 69 },
    { description: "男性/高め/5  jvs076", value: 75 },
    { description: "男性/高め/6  jvs086", value: 85 },
    { description: "男性/高め/7  jvs001", value: 0 },
    { description: "男性/高め/8  jvs041", value: 40 },
    { description: "男性/高め/9  jvs050", value: 49 },
    { description: "男性/高め/10  jvs052", value: 51 },
    { description: "男性/高め/11  jvs075", value: 74 },
    { description: "男性/高め/12  jvs080", value: 79 },
    { description: "男性/高め/13  jvs087", value: 86 },
    { description: "男性/高め/14  jvs099", value: 98 },
    { description: "男性/高め/15  jvs097", value: 96 },
    { description: "男性/高め/16  jvs011", value: 10 },
    { description: "男性/高め/17  jvs054", value: 53 },
    { description: "男性/高め/18  jvs047", value: 46 },
    { description: "男性/高め/19  jvs032", value: 31 },
    { description: "男性/高め/20  jvs098", value: 97 },
    { description: "女性/低め/1  jvs091", value: 90 },
    { description: "女性/低め/2  jvs016", value: 15 },
    { description: "女性/低め/3  jvs035", value: 34 },
    { description: "女性/低め/4  jvs043", value: 42 },
    { description: "女性/低め/5  jvs064", value: 63 },
    { description: "女性/低め/6  jvs029", value: 28 },
    { description: "女性/低め/7  jvs025", value: 24 },
    { description: "女性/低め/8  jvs092", value: 91 },
    { description: "女性/低め/9  jvs018", value: 17 },
    { description: "女性/低め/10  jvs082", value: 81 },
    { description: "女性/低め/11  jvs095", value: 94 },
    { description: "女性/低め/12  jvs062", value: 61 },
    { description: "女性/低め/13  jvs017", value: 16 },
    { description: "女性/普通/1  jvs008", value: 7 },
    { description: "女性/普通/2  jvs084", value: 83 },
    { description: "女性/普通/3  jvs007", value: 6 },
    { description: "女性/普通/4  jvs094", value: 93 },
    { description: "女性/普通/5  jvs027", value: 26 },
    { description: "女性/普通/6  jvs002", value: 1 },
    { description: "女性/普通/7  jvs063", value: 62 },
    { description: "女性/普通/8  jvs058", value: 57 },
    { description: "女性/普通/9  jvs055", value: 54 },
    { description: "女性/普通/10  jvs056", value: 55 },
    { description: "女性/普通/11  jvs057", value: 56 },
    { description: "女性/普通/12  jvs090", value: 89 },
    { description: "女性/普通/13  jvs059", value: 58 },
    { description: "女性/普通/14  jvs019", value: 18 },
    { description: "女性/普通/15  jvs085", value: 84 },
    { description: "女性/普通/16  jvs069", value: 68 },
    { description: "女性/普通/17  jvs038", value: 37 },
    { description: "女性/普通/18  jvs053", value: 52 },
    { description: "女性/普通/19  jvs072", value: 71 },
    { description: "女性/普通/20  jvs096", value: 95 },
    { description: "女性/高め/1  jvs039", value: 38 },
    { description: "女性/高め/2  jvs040", value: 39 },
    { description: "女性/高め/3  jvs030", value: 29 },
    { description: "女性/高め/4  jvs051", value: 50 },
    { description: "女性/高め/5  jvs083", value: 82 },
    { description: "女性/高め/6  jvs004", value: 3 },
    { description: "女性/高め/7  jvs015", value: 14 },
    { description: "女性/高め/8  jvs067", value: 66 },
    { description: "女性/高め/9  jvs024", value: 23 },
    { description: "女性/高め/10  jvs060", value: 59 },
    { description: "女性/高め/11  jvs036", value: 35 },
    { description: "女性/高め/12  jvs026", value: 25 },
    { description: "女性/高め/13  jvs065", value: 64 },
    { description: "女性/高め/14  jvs066", value: 65 },
    { description: "女性/高め/15  jvs014", value: 13 },
    { description: "女性/高め/16  jvs093", value: 92 },
    { description: "女性/高め/17  jvs010", value: 9 },
    { description: "女性/高め/18  jvs061", value: 60 },
]
