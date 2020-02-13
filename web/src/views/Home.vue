<template>
  <div>
    <swiper :options="swiperOption">
      <swiper-slide><img class="w-100" src="../assets/adone.jpg" alt=""></swiper-slide>
      <swiper-slide><img class="w-100" src="../assets/adtwo.jpeg" alt=""></swiper-slide>
      <swiper-slide><img class="w-100" src="../assets/adthree.jpeg" alt=""></swiper-slide>
      <swiper-slide><img class="w-100" src="../assets/adfour.png" alt=""></swiper-slide>
      <swiper-slide><img class="w-100" src="../assets/adfive.jpeg" alt=""></swiper-slide>
      <div class="swiper-pagination pagination-home text-right px-3 pb-2"  slot="pagination"></div>
    </swiper>
    <!-- end of swiper -->
    <div class="nav-icons bg-white mt-3 text-center pt-3 text-grey">
      <div class="d-flex flex-wrap">
        <div class="nav-item mb-2">
          <i class="sprite sprite-news"></i>
          <div class="py-2">资料站</div>
        </div>
        <div class="nav-item mb-2">
          <i class="sprite sprite-story"></i>
          <div class="py-2">故事站</div>
        </div>
        <div class="nav-item mb-2">
          <i class="sprite sprite-store"></i>
          <div class="py-2">周边商城</div>
        </div>
        <div class="nav-item mb-2">
          <i class="sprite sprite-try"></i>
          <div class="py-2">体验服</div>
        </div>
        <div class="nav-item mb-2">
          <i class="sprite sprite-new"></i>
          <div class="py-2">新手专区</div>
        </div>
        <div class="nav-item mb-2">
          <i class="sprite sprite-announcement"></i>
          <div class="py-2">公告栏</div>
        </div>
        <div class="nav-item mb-2">
          <i class="sprite sprite-community"></i>
          <div class="py-2">交流社区</div>
        </div>
        <div class="nav-item mb-2">
          <i class="sprite sprite-wx"></i>
          <div class="py-2">微信公众号</div>
        </div>
      </div>
      <div class="bg-light py-2 fs-sm">
        <i class="sprite sprite-arrow mr-1"></i>
        <span>收起</span>
      </div>
    </div>
    <!-- end of nav icons -->

    <m-list-card icon="menu1" title="新闻资讯" :categories="newsCats">
      <template #items="{category}">
        <router-link tag="div" :to="`/articles/${news._id}`" class="py-2 fs-lg d-flex" v-for="(news,i) in category.newsList" :key="i" >
          <span class="text-info">[{{ news.categoryName }}]</span>
          <span class="px-2">|</span>
          <span class="flex-1 text-dark-1 text-ellipsis pr-2">{{ news.title }}</span>
          <span class="text-grey fs-sm">{{news.createdAt | date}}</span>
        </router-link>
      </template>
    </m-list-card>
    <m-list-card icon="card-hero" title="英雄列表" :categories="heroCats">
      <template #items="{category}">
        <div class="d-flex flex-wrap" style="margin: 0 -0.5rem">
          <router-link tag="div" :to="`/heroes/${hero._id}`" class="p-2 text-center" style="width:20%"
                       v-for="(hero,i) in category.heroList" :key="i" >
            <img :src="hero.avatar" :alt="hero.name" style="width:100%" >
            <div>{{ hero.name }}</div>
          </router-link>
        </div>
      </template>
    </m-list-card>
  </div>
</template>

<script>
  import dayjs from 'dayjs'
export default {
  filters:{
    date(val){
      return dayjs(val).format('MM/DD')
    }
  },
  data() {
    return {
      swiperOption: {
        pagination:{
          el: ".swiper-pagination"
        }
      },
        newsCats:[],
        heroCats:[]
    }
  },
  methods:{
    async fetchNewsCats(){
      const res = await this.$http.get('news/list')
      this.newsCats = res.data
    },
    async fetchHeroCats(){
      const res = await this.$http.get('heroes/list')
      this.heroCats = res.data
    }
  },
  created() {
    this.fetchNewsCats()
    this.fetchHeroCats()
  }
}
</script>

<style lang="scss" scoped>
  @import "../assets/scss/variables";
  .pagination-home{
    .swiper-pagination-bullet{
      opacity: 1;
      border-radius: 0.1538rem;
      background: map-get($colors, 'white');
    }
    .swiper-pagination-bullet-active{
      background: map-get($colors, 'info');
    }
  }
  .nav-icons{
    border-top: 1px solid $border-color;
    border-bottom: 1px solid $border-color;
    .nav-item{
      width: 25%;
      border-left: 1px solid $border-color;
      &:nth-child(4n+1){
        border-left: none;
      }
    }
  }

</style>