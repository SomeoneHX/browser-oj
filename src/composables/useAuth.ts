import { computed, ref } from 'vue'
import { clearNickname, getNickname, getUserUid, isLoggedIn, setNickname, setUserUid } from '../utils/storage'

const nickname = ref(getNickname())
const userUid = ref(getUserUid())

export function useAuth() {
  return {
    nickname: computed(() => nickname.value),
    userUid: computed(() => userUid.value),
    avatarUrl: computed(() => (userUid.value ? `https://cdn.luogu.com.cn/upload/usericon/${encodeURIComponent(userUid.value)}.png` : '')),
    loggedIn: computed(() => Boolean(nickname.value) && isLoggedIn()),
    login(name: string, uid: string | number | undefined | null) {
      setNickname(name)
      setUserUid(uid)
      nickname.value = name
      userUid.value = uid ? String(uid) : ''
    },
    logout() {
      clearNickname()
      nickname.value = ''
      userUid.value = ''
    },
  }
}
