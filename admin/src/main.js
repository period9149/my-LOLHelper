import Vue from 'vue'
import App from './App.vue'
import './plugins/element.js'
import router from './router'
import http from './http'
import './style.css'

Vue.config.productionTip = false
Vue.prototype.$http = http

Vue.mixin({
  methods:{
    getAuthHeaders(){
      return {
        Authorization: `Bearer ${localStorage.token || ''}`
      }
    }
  },
  computed:{
    uploadUrl(){
      return this.$http.defaults.baseURL + '/upload'
    }
  }
})

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
