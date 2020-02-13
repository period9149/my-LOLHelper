<template>
    <m-card :icon="icon" :title="title">
    <div class="nav jc-between mt-1">
        <div class="nav-item" :class="{ active: active === i }"
             v-for="(category, i) in categories" :key="i" @click="$refs.list.swiper.slideTo(i)">
            <div class="nav-link">{{ category.name }}</div>
        </div>
    </div>
    <swiper ref="list" :options="{ autoHeight: true }" class="mt-2" @slide-change="() => active = $refs.list.swiper.realIndex">
        <swiper-slide v-for="(category, i) in categories" :key="i">
            <slot name="items" :category="category"></slot>
        </swiper-slide>
    </swiper>
    </m-card>
</template>

<script>
    export default {
        props:{
            title: { type: String, required: true },
            icon: { type: String, required: true },
            categories:{ type: Array, required: true }
        },
        data(){
            return{
                active: 0
            }
        }
    }
</script>

<style scoped>

</style>