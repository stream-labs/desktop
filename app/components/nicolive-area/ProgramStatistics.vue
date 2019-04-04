<template>
    <div>
        <div>
            <span>視聴者数: {{ viewers }}</span>
            <span>コメント数: {{ comments }}</span>
            <span>ニコニ広告pt: {{ adPoint }}</span>
            <span>ギフトpt: {{ giftPoint }}</span>
        </div>
        <div>
            <a @click.prevent="openInDefaultBrowser($event)" :href="twitterShareURL">share in twitter</a>
            <a @click.prevent="openInDefaultBrowser($event)" :href="contentTreeURL">コンテンツツリー</a>
            <a @click.prevent="openInDefaultBrowser($event)" :href="creatorsProgramURL">クリエイター奨励プログラム</a>
        </div>
    </div>
</template>

<script lang="ts" src="./ProgramStatistics.vue.ts"></script>
