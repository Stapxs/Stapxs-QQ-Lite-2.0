<template>
    <div class="ss-card face-pan">
      <div class="layui-tab layui-tab-brief">
        <ul class="layui-tab-title chat-info-tab fase-pan-tab">
          <li class="layui-this">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M130.7 313.9C126.5 300.4 137.8 288 151.1 288H364.5C378.7 288 389.9 300.4 385.8 313.9C368.1 368.4 318.2 408 258.2 408C198.2 408 147.5 368.4 130.7 313.9V313.9zM208.4 192C208.4 209.7 194 224 176.4 224C158.7 224 144.4 209.7 144.4 192C144.4 174.3 158.7 160 176.4 160C194 160 208.4 174.3 208.4 192zM281.9 214.6C273.9 207 273.5 194.4 281 186.3C295.6 170.8 316.3 164 335.6 164C354.1 164 375.7 170.8 390.2 186.3C397.8 194.4 397.4 207 389.3 214.6C381.2 222.1 368.6 221.7 361 213.7C355.6 207.8 346.3 204 335.6 204C324.1 204 315.7 207.8 310.2 213.7C302.7 221.7 290 222.1 281.9 214.6zM512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256zM256 48C141.1 48 48 141.1 48 256C48 370.9 141.1 464 256 464C370.9 464 464 370.9 464 256C464 141.1 370.9 48 256 48z"/></svg>
          </li>
          <!-- <li>2</li>
          <li>3</li> -->
        </ul>
        <div class="layui-tab-content">
          <div class="layui-tab-item layui-show">
            <div class="base-face">
              <div
                v-for="index in baseFaceMax"
                :key="'base-face-' + index"
                v-if="baseFacePass.indexOf(index) == -1"
                @click="addBaseFace(index)">
                <img loading="lazy"
                  :src="require('./../../assets/src/qq-face/' + index + '.gif')">
              </div>
            </div>
          </div>
          <div class="layui-tab-item">2</div>
          <div class="layui-tab-item">3</div>
        </div>
      </div>
    </div>
</template>

<script>
export default {
  name: 'FacePan',
  props: ['display'],
  data () {
    return {
      baseFaceMax: 323,
      baseFacePass: [17, 40, 44, 45, 47, 48, 50, 51, 52, 58, 65, 68, 70, 71, 73, 80, 81, 82, 83, 84, 87, 88, 92, 93, 94, 95, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 275, 276]
    }
  },
  methods: {
    addSpecialMsg: function (json, addText) {
      this.$emit('addSpecialMsg',
        {
          addText: addText,
          msgObj: json
        }
      )
    },
    addBaseFace: function (id) {
      this.addSpecialMsg({type: 'face', id: id}, true)
    }
  }
}
</script>
