import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Main from "../views/Main"
import Article from "../views/Article"
import Hero from "../views/Hero"

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    component: Main,
    children: [
      { path:'/', name:'home', component: Home},
      { path: '/articles/:id', name: 'article', component: Article, props: true }
    ]
  },
  {
    path: '/heroes/:id',
    name:'hero',
    component: Hero,
    props: true
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  }
]

const router = new VueRouter({
  routes
})

export default router
