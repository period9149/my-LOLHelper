<template>
    <div class="about">
        <h1>{{ id ? '编辑' : '新建'}}英雄</h1>
        <el-form>
            <el-tabs type="border-card" value="basic">
                <el-tab-pane label="基础信息" name="basic">
                    <el-form-item label="名称">
                        <el-input v-model="model.name"></el-input>
                    </el-form-item>
                    <el-form-item label="称号">
                        <el-input v-model="model.title"></el-input>
                    </el-form-item>
                    <el-form-item label="头像">
                        <el-upload
                                class="avatar-uploader"
                                :action="uploadUrl"
                                :headers="getAuthHeaders()"
                                :show-file-list="false"
                                :on-success="res => $set(model, 'avatar', res.url)">
                            <img v-if="model.avatar" :src="model.avatar" class="avatar">
                            <i v-else class="el-icon-plus avatar-uploader-icon"></i>
                        </el-upload>
                    </el-form-item>
                    <el-form-item label="原画">
                        <el-upload
                                class="avatar-uploader"
                                :action="uploadUrl"
                                :headers="getAuthHeaders()"
                                :show-file-list="false"
                                :on-success="res => $set(model, 'banner', res.url)">
                            <img v-if="model.banner" :src="model.banner" class="avatar">
                            <i v-else class="el-icon-plus avatar-uploader-icon"></i>
                        </el-upload>
                    </el-form-item>
                    <el-form-item label="类型">
                        <el-select v-model="model.categories" multiple>
                            <el-option v-for="item of categories" :key="item._id" :label="item.name" :value="item._id"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="难度">
                        <el-rate :max="9" v-model="model.scores.difficult" show-score style="margin-top: 0.6rem"></el-rate>
                    </el-form-item>
                    <el-form-item label="技能">
                        <el-rate :max="9" v-model="model.scores.skills" show-score style="margin-top: 0.6rem"></el-rate>
                    </el-form-item>
                    <el-form-item label="攻击">
                        <el-rate :max="9" v-model="model.scores.attack" show-score style="margin-top: 0.6rem"></el-rate>
                    </el-form-item>
                    <el-form-item label="生存">
                        <el-rate :max="9" v-model="model.scores.survive" show-score style="margin-top: 0.6rem"></el-rate>
                    </el-form-item>
                    <el-form-item label="顺风出装">
                        <el-select v-model="model.items1" multiple>
                            <el-option v-for="item of items" :key="item._id" :label="item.name" :value="item._id"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="逆风出装">
                        <el-select v-model="model.items2" multiple>
                            <el-option v-for="item of items" :key="item._id" :label="item.name" :value="item._id"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="使用技巧">
                        <el-input type="textarea" v-model="model.usageTips"></el-input>
                    </el-form-item>
                    <el-form-item label="对抗技巧">
                        <el-input type="textarea" v-model="model.battleTips"></el-input>
                    </el-form-item>
                    <el-form-item label="团战思路">
                        <el-input type="textarea" v-model="model.teamTips"></el-input>
                    </el-form-item>
                </el-tab-pane>
                <el-tab-pane label="技能" name="skills">
                    <el-button size="small" @click="model.skills.push({})"><i class="el-icon-plus"></i>添加技能</el-button>
                    <el-row type="flex" style="flex-wrap: wrap;margin: 10px 10px" >
                        <el-col :md="8" v-for="(item, i) in model.skills" :key="i" style="margin:2rem ">
                            <el-form-item label="名称" label-width="70">
                                <el-input v-model="item.name"></el-input>
                            </el-form-item>
                            <el-form-item label="图标">
                                <el-upload
                                        class="avatar-uploader"
                                        :action="uploadUrl"
                                        :headers="getAuthHeaders()"
                                        :show-file-list="false"
                                        :on-success="res => $set(item, 'icon', res.url) ">
                                    <img v-if="item.icon" :src="item.icon" class="avatar">
                                    <i v-else class="el-icon-plus avatar-uploader-icon"></i>
                                </el-upload>
                            </el-form-item>
                            <el-form-item label="冷却值">
                                <el-input v-model="item.delay"></el-input>
                            </el-form-item>
                            <el-form-item label="消耗">
                                <el-input v-model="item.cost"></el-input>
                            </el-form-item>
                            <el-form-item label="描述">
                                <el-input v-model="item.description" type="textarea"></el-input>
                            </el-form-item>
                            <el-form-item label="小提示">
                                <el-input v-model="item.tips" type="textarea"></el-input>
                            </el-form-item>
                            <el-form-item>
                                <el-button size="small" type="danger" @click="model.skills.splice(i)">删除</el-button>
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-tab-pane>
                <el-tab-pane label="最佳搭档" name="partners">
                    <el-button size="small" @click="model.partners.push({})"><i class="el-icon-plus"></i>添加英雄</el-button>
                    <el-row type="flex" style="flex-wrap: wrap;margin: 10px 10px" >
                        <el-col :md="8" v-for="(item, i) in model.partners" :key="i" style="margin:2rem ">
                            <el-form-item label="名称" label-width="70">
                                <el-select filterable v-model="item.hero">
                                    <el-option v-for="hero in heroes" :key="hero._id"
                                               :value="hero._id" :label="hero.name">
                                    </el-option>
                                </el-select>
                            </el-form-item>

                            <el-form-item label="描述">
                                <el-input v-model="item.description" type="textarea"></el-input>
                            </el-form-item>

                            <el-form-item>
                                <el-button size="small" type="danger" @click="model.partners.splice(i)">删除</el-button>
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-tab-pane>
            </el-tabs>
            <el-form-item style="margin-top: 1rem">
                <el-button type="primary" @click="save">保存</el-button>
            </el-form-item>
        </el-form>
    </div>
</template>

<script>
    export default {
        props:{
            id:{}
        },
        data(){
            return {
                model:{
                    name:'',
                    avatar:'',
                    scores:{
                        difficult: 0,
                        attack: 0,
                        skills: 0,
                        survive: 0
                    },
                    skills:[],
                    partners:[]
                },
                categories:[],
                items:[],
                heros:[]
            }
        },
        methods:{
            async save(){
                if(this.id){
                    //修改
                    await this.$http.put(`rest/heroes/${this.id}`, this.model)
                }else{
                    //新建
                    await this.$http.post('rest/heroes', this.model)
                }
                this.$message({
                    type:'success',
                    message:'保存成功'
                })
            },
            async fetch(){
                const res = await this.$http.get(`rest/heroes/${this.id}`)
                this.model = Object.assign({},this.model, res.data) //不会覆盖原有的值
            },
            async fetchCategories(){
                const res = await this.$http.get(`rest/categories`)
                this.categories = res.data
            },
            async fetchItems(){
                const res = await this.$http.get(`rest/items`)
                this.items = res.data
            },
            async fetchHeros(){
                const res = await this.$http.get(`rest/heroes`)
                this.heroes = res.data
            }
        },
        created() {
            this.fetchCategories()
            this.fetchItems()
            this.fetchHeros()
            this.id && this.fetch();
        }
    }
</script>
