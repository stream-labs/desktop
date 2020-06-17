<template>
    <div class="program-statistics">
        <ul class="program-statistics-list">
            <li class="program-statistics-item" v-tooltip.bottom="visitorTooltip"><i class="program-statistics-icon icon-visitor"></i><span class="program-statistics-value">{{ viewers }}</span></li>
            <li class="program-statistics-item" v-tooltip.bottom="commentTooltip"><i class="program-statistics-icon icon-comment"></i><span class="program-statistics-value">{{ comments }}</span></li>
            <li class="program-statistics-item" v-tooltip.bottom="adPointTooltip"><i class="program-statistics-icon icon-nicoad"></i><span class="program-statistics-value">{{ adPoint }}</span></li>
            <li class="program-statistics-item" v-tooltip.bottom="giftPointTooltip"><i class="program-statistics-icon icon-gift"></i><span class="program-statistics-value">{{ giftPoint }}</span></li>
        </ul>
        <div class="program-menu">
            <div class="program-menu-item">
                <a @click.prevent="openInDefaultBrowser($event)" :href="twitterShareURL" class="link"><i class="icon-twitter icon-btn" v-tooltip.bottom="twitterShareTooltip"></i></a>
            </div>
            <div class="program-menu-item" :class="{ 'is-show': showPopupMenu }">
              <popper
                trigger="click"
                :options="{ placement: 'bottom-end' }"
                @show="showPopupMenu = true"
                @hide="showPopupMenu = false"
              >
                  <div class="popper">
                      <ul class="popup-menu-list">
                          <li class="popup-menu-item"><a @click.prevent="openInDefaultBrowser($event)" :href="contentTreeURL" class="link"><i class="icon-contents-tree"></i>コンテンツツリーを見る</a></li>
                          <li class="popup-menu-item"><a @click.prevent="openInDefaultBrowser($event)" :href="creatorsProgramURL" class="link"><i class="icon-creator-promotion-program"></i>奨励プログラムに登録する</a></li>
                      </ul>
                  </div>

                  <button slot="reference" class="popup-toggle-btn">
                      <i class="icon-ellipsis-horizontal icon-btn"></i>
                  </button>

              </popper>
            </div>
        </div>
    </div>
</template>

<script lang="ts" src="./ProgramStatistics.vue.ts"></script>
<style lang="less" scoped>
@import "../../styles/index";

.program-statistics {
    display: flex;
    height: 48px;
    padding: 0 16px;
    justify-content: space-between;
}

.program-statistics-list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    list-style: none;
    margin: 0;
}

.program-statistics-item {
    display: flex;
    align-items: center;
    font-size: 12px;
    margin-right: 16px;
    color: @text-secondary;
 }

.program-statistics-icon {
    margin-right: 8px;
    color: @grey;
}

.program-statistics-value {
    color: @light-grey;
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

 .popup-toggle-btn {
     display: flex;

     .is-show & {
        i {
            color: @text-active;
            opacity: 1;
        }
    }
 }

 .popper {
    //TODO: 重なり順を変数で管理したい
    z-index: 3;
 }

 .popup-menu-list {
    min-width: 220px;
    list-style: none;
    position: absolute;
    top: 6px;
    right: 0;
    
    border-radius: 4px;
    padding: 8px 1px;
    background-color: @bg-primary;
    box-shadow: 0 0 4px rgba(@black, 0.5), inset 0 0 0 1px rgba(@white, 0.1);
 }

.popup-menu-item {
    i {
        color: @white;
        font-size: 14px;
        margin-right: 16px;
        color: @light-grey;
    }

    a {
        color: @white;
        display: flex;
        font-size: 12px;
        padding: 8px 16px;
        text-decoration: none;

        &:hover {
            .bg-hover();
        }
    }
}

</style>