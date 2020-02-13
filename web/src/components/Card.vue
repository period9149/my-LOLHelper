<template>
    <div class="card p-3 bg-white mt-3" >
        <div class="card-header d-flex ai-center" :class="{'border-bottom': !plain, 'pb-3': !plain}">
            <i class="iconfont" :class="`icon-${icon}`"></i>
            <div class="fs-lg flex-1 px-2"><strong>{{ title }}</strong></div>
            <i class="iconfont icon-menu" v-if="!plain"></i>
        </div>
        <div class="card-body pt-2">
            <slot></slot>
        </div>
    </div>
</template>

<script>
    export default {
        props:{
            title: { type: String, required: true },
            icon: { type: String, required: true },
            plain: { type: Boolean }
        }
    }
</script>

<style scoped lang="scss">
    @import "../assets/scss/variables";
    hr{
        background-color: lightgrey;
        width: 90%;
        height:1px;
        border: none;
        border-top:1px solid #ddd;
        margin:10px auto;
    }
    .card {
        border-bottom: 1px solid $border-color;
    }
</style>