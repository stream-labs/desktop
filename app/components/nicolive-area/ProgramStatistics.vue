<template>
    <div class="program-statistics">
        <ul class="program-statistics-list">
            <li class="program-statistics-item" v-tooltip.bottom="visitorTooltip"><i class="program-statistics-icon icon-visitor"></i><span class="program-statistics-value">{{ viewers }}</span></li>
            <li class="program-statistics-item" v-tooltip.bottom="commentTooltip"><i class="program-statistics-icon icon-comment"></i><span class="program-statistics-value">{{ comments }}</span></li>
            <li class="program-statistics-item" v-tooltip.bottom="adPointTooltip"><i class="program-statistics-icon icon-uad"></i><span class="program-statistics-value">{{ adPoint }}</span></li>
            <li class="program-statistics-item" v-tooltip.bottom="giftPointTooltip"><i class="program-statistics-icon icon-gift"></i><span class="program-statistics-value">{{ giftPoint }}</span></li>
        </ul>
        <div class="program-menu">
            <div class="program-menu-item">
                <a @click.prevent="openInDefaultBrowser($event)" :href="twitterShareURL" v-tooltip.bottom="twitterShareTooltip" class="link"><i class="icon-twitter icon-btn"></i></a>
            </div>
            <div class="program-menu-item popup-menu-wrapper" :class="[{ 'is-show':showPopupMenu }]">
                <button class="popup-toggle-btn" @click="showPopupMenu=!showPopupMenu"><i class="icon-ellipsis-horizontal icon-btn"></i></button>
                <ul class="popup-menu-list">
                    <li class="popup-menu-item"><a @click.prevent="openInDefaultBrowser($event)" :href="contentTreeURL" class="link"><i class="icon-contents-tree"></i>コンテンツツリーを見る</a></li>
                    <li class="popup-menu-item"><a @click.prevent="openInDefaultBrowser($event)" :href="creatorsProgramURL" class="link"><i class="icon-creator-promotion-program"></i>奨励プログラムに登録する</a></li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script lang="ts" src="./ProgramStatistics.vue.ts"></script>
<style lang="less" scoped>
@import "../../styles/_colors";
@import "../../styles/mixins";

.program-statistics {
    display: flex;
    padding: 12px 16px;
    justify-content: space-between;
}

.program-statistics-list {
    display: flex;
    flex-wrap: wrap;
    list-style: none;
    margin: 0;
}

.program-statistics-item {
    display: flex;
    align-items: center;
    margin-right: 16px;
    color: @text-secondary;
 }

.program-statistics-icon {
    font-size: 14px;
    margin-right: 8px;
}

.program-statistics-value {
    font-size: 14px;
}

.program-menu {
     display: flex;
 }

.program-menu-item {
    display: flex;
    align-items: center;
    margin-left: 12px;

    .link {
        text-decoration: none;
    }
}

 .popup-menu-wrapper {
    position: relative;
 }

 .popup-toggle-btn {
     .is-show & {
        i {
            color: @text-active;
            opacity: 1;
        }
    }
 }

 .popup-menu-list {
    display: none;
    min-width: 200px;
    z-index: 2;
    list-style: none;
    position: absolute;
    top: 20px;
    right: 0;
    box-shadow: 0 0 4px rgba(0,0,0,.1);

    .is-show & {
         display: block;
    }
 }

.popup-menu-item {
    background-color: @bg-quaternary;

    &:not(:last-child) {
        border-bottom: 1px solid @bg-primary;
    }

    i {
        font-size: 14px;
        margin-right: 8px;
    }

    a {
        display: flex;
        font-size: 12px;
        padding: 12px;
        text-decoration: none;
    }
}

</style>
