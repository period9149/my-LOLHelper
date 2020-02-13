<template>
    <div class="page-hero" v-if="model">
        <div class="topbar bg-black py-2 px-3 d-flex ai-center text-center text-white">
            <img src="../assets/logo.jpg" height="30">
            <span class="text-white pl-2">英雄联盟</span>
            <div class="pr-4 flex-1 ">
                <span>攻略中心</span>
            </div>
            <router-link to="/" tag="div">更多英雄 &gt;</router-link>
        </div>
        <div class="top" :style="{'background-image': `url(${model.banner})`}">
            <div class="info text-white d-flex h-100 flex-column jc-end p-3">
                <div class="fs-sm">{{ model.title }}</div>
                <h2 class="my-2">{{ model.name }}</h2>
                <div class="fs-sm">{{ model.categories.map(v => v.name).join('/') }}</div>
                <div class="d-flex jc-between pt-2">
                    <div class="scores d-flex ai-center " v-if="model.scores">
                        <span>难度</span>
                        <span class="badge bg-primary">{{ model.scores.difficult }}</span>
                        <span>技能</span>
                        <span class="badge bg-blue-1">{{ model.scores.skills }}</span>
                        <span>攻击</span>
                        <span class="badge bg-red">{{ model.scores.attack }}</span>
                        <span>生存</span>
                        <span class="badge bg-dark">{{ model.scores.survive }}</span>
                    </div>
                    <router-link to="/" tag="span" class="text-grey fs-sm">
                        皮肤 &gt;
                    </router-link>
                </div>
            </div>
        </div>
        <!-- end of top -->
        <div>
            <div class="px-3 bg-white">
                <div class="nav d-flex jc-around pt-3 pb-2 border-bottom">
                    <div class="nav-item active">
                        <div class="nac-link">英雄初识</div>
                    </div>
                    <div class="nav-item">
                        <div class="nac-link">进阶攻略</div>
                    </div>
                </div>
            </div>
            <swiper>
                <swiper-slide>
                    <div>
                        <div class="p-3 bg-white border-bottom">
                            <div class="d-flex">
                                <router-link tag="button" to="/" class="btn flex-1 btn-lg">
                                    <i class="icon-font icon-menu1"></i>英雄介绍视频
                                </router-link>
                                <router-link tag="button" to="/" class="btn flex-1 ml-2 btn-lg">
                                    <i class="icon-font icon-menu1"></i>一图识英雄
                                </router-link>
                            </div>
                            <div class="skills bg-white mt-4">
                                <div class="d-flex jc-around">
                                    <img v-for="(item,i) in model.skills" :src="item.icon" class="icon"
                                         :class="{ active: currentSkillIndex === i}"
                                         @click = "  currentSkillIndex = i"
                                         :key="item.name" width="60" height="60">
                                </div>
                                <div v-if="currentSkill">
                                    <div class="d-flex pt-4 pb-3">
                                        <h3 class="m-0">{{ currentSkill.name }}</h3>
                                        <span class="text-grey-1 ml-3">
                                           （冷却值 : {{ currentSkill.delay }} 消耗 : {{ currentSkill.cost }})
                                        </span>
                                    </div>
                                    <p> {{ currentSkill.description }} </p>
                                    <div class="border-bottom"></div>
                                    <p class="text-grey"> 建议：{{ currentSkill.tips }} </p>
                                </div>
                            </div>
                        </div>
                        <m-card plain icon="menu1" title="出装推荐" class="hero-items">
                            <div class="fs-lg pt-1">顺风出装：</div>
                            <div class="d-flex jc-around text-center ">
                                <div v-for="item in model.items1" :key="item.name" class="mt-3 iname">
                                    <img :src="item.icon" class="icon">
                                    <div class="fs-xs">{{ item.name }}</div>
                                </div>
                            </div>
                        </m-card>
                        <m-card plain icon="menu1" title="出装推荐" class="hero-items">
                            <div class="fs-lg pt-1">逆风出装：</div>
                            <div class="d-flex jc-around text-center ">
                                <div v-for="item in model.items2" :key="item.name" class="mt-3 iname">
                                    <img :src="item.icon" class="icon">
                                    <div class="fs-xs">{{ item.name }}</div>
                                </div>
                            </div>
                        </m-card>
                        <m-card plain icon="menu1" title="使用技巧">
                            <p class="m-0"> {{ model.usageTips }} </p>
                        </m-card>
                        <m-card plain icon="menu1" title="对抗技巧">
                            <p class="m-0"> {{ model.battleTips }} </p>
                        </m-card>
                        <m-card plain icon="menu1" title="团战思路">
                            <p class="m-0"> {{ model.teamTips }} </p>
                        </m-card>
                        <m-card plain icon="menu1" title="英雄关系">
                            <div class="fs-xl">最佳搭档</div>
                            <div v-for="item in model.partners" :key="item.name"
                            class="d-flex pt-3">
                                <img :src="item.hero.avatar" alt="" height="40">
                                <p class="flex-1  ml-3 ">
                                    {{ item.description }}
                                </p>
                            </div>
                        </m-card>
                    </div>
                </swiper-slide>
                <swiper-slide></swiper-slide>
            </swiper>
        </div>
    </div>
</template>

<script>
    export default {
        props:{
            id:{ required: true }
        },
        data(){
            return{
                model: null,
                currentSkillIndex: 0
            }
        },
        methods:{
            async fetch(){
                const res = await this.$http.get(`heroes/${this.id}`)
                this.model = res.data
            }
        },
        computed:{
         currentSkill(){
             return this.model.skills[this.currentSkillIndex]
         }
        },
        created() {
            this.fetch();
        }
    }
</script>

<style lang="scss">
    @import "../assets/scss/variables";
.page-hero{
    .top{
        height: 50vw;
        background: #fff no-repeat top ;
        background-size: auto 120% ;
    }
    .info{
        background: linear-gradient(rgba(0, 0, 0, 0),rgba(0, 0, 0, 1));
        .scores{
            .badge{
                margin: 0 0.25rem;
                display: inline-block;
                width: 1rem;
                height: 1rem;
                line-height: 0.9rem;
                text-align: center;
                border-radius: 50%;
                font-size: 0.6rem;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
        }
    }
    .skills{
        img.active{
            border: 3px solid map-get($colors, 'primary');
        }
    }
    .hero-items{
        img.icon{
            width: 40px;
            height: 40px;
        }
    }
    .iname{
        width: 40px;
    }
}
</style>