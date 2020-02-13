import Vue from 'vue'
import VueRouter from 'vue-router'
import Main from '../views/Main'
import CategoryEdit from '../views/CategoryEdit'
import CategoryList from '../views/CategoryList'
import itemEdit from "../views/itemEdit"
import itemList from "../views/itemList"
import HeroEdit from "../views/HeroEdit"
import HeroList from "../views/HeroList"
import ArticleEdit from "../views/ArticleEdit"
import ArticleList from "../views/ArticleList"
import AdList from "../views/AdList"
import AdEdit from "../views/AdEdit"
import AdminUserEdit from "../views/AdminUserEdit"
import AdminUserList from "../views/AdminUserList"
import Login from "../views/Login"

Vue.use(VueRouter)

const routes = [
    { path: '/login', name: 'login', component: Login, meta: { isPublic: true }},
    {
    path: '/',
    name: 'Main',
    component: Main,
    children:[

      { path:'/categories/create', component: CategoryEdit },
      { path:'/categories/edit/:id', component: CategoryEdit, props: true },
      { path:'/categories/list', component: CategoryList},

      { path:'/items/create', component: itemEdit },
      { path:'/items/edit/:id', component: itemEdit, props: true },
      { path:'/items/list', component: itemList},

      { path:'/heroes/create', component: HeroEdit },
      { path:'/heroes/edit/:id', component: HeroEdit, props: true },
      { path:'/heroes/list', component: HeroList},

      { path:'/articles/create', component: ArticleEdit },
      { path:'/articles/edit/:id', component: ArticleEdit, props: true },
      { path:'/articles/list', component: ArticleList},

      { path:'/ads/create', component: AdEdit },
      { path:'/ads/edit/:id', component: AdEdit, props: true },
      { path:'/ads/list', component: AdList},

      { path:'/admin_users/create', component: AdminUserEdit },
      { path:'/admin_users/edit/:id', component: AdminUserEdit, props: true },
      { path:'/admin_users/list', component: AdminUserList},
    ]
  }

]

const router = new VueRouter({
  routes
})

router.beforeEach((to, from, next) => {
  if(!to.meta.isPublic && !localStorage.token){
      return next('/login')
  }
  next()
})

export default router
