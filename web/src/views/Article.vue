<template>
    <div class="page-article" v-if="model">
        <div class="d-flex py-3 px-2 border-bottom">
           <router-link tag="div" to="/" class="iconfont pr-2 icons" >&#xe697;</router-link>
            <strong class="flex-1">
                {{ model.title }}
            </strong>
            <div class="text-grey fs-xs">
                02-06
            </div>
        </div>
        <div v-html="model.body" class="px-3 m-body"></div>
        <div class="px-3 border-top py-2">
            <div class="d-flex ai-center">
                <i class="iconfont">&#xe795;</i>
                <strong class="text-blue fs—lg ml-1 ">相关资讯</strong>
            </div>
            <div class="pt-2">
                <router-link :to="`/articles/${item._id}`" tag="div"
                             v-for="item in model.related" :key="item.id"
                             class="py-1 mt-2">
                    {{ item.title }}
                </router-link>
            </div>
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
               model: {}
            }
        },
        methods:{
            async fetch(){
                const res = await this.$http.get(`articles/${this.id}`)
                this.model = res.data
            }
        },
        watch:{
            id: 'fetch'
        },
        created(){
            this.fetch()
        }
    }
</script>

<style lang="scss">
.page-article{
    .icons{
        font-size: 1.5rem;
    }
    .m-body{
        img{
            width: 100%;
            height: auto;
        }
        iframe{
            width: 100%;
            height: auto;
        }
    }
}
</style>