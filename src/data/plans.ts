import { PassPlan } from '../types'

export const passPlans: PassPlan[] = [
  {
    id: 'plan-member',
    name: '會員優惠卡',
    duration: 4, // 4 hours per session
    price: 0,
    credit: 200, // HKD credit
    description: '免費領取 - 即享HK$200優惠',
    features: [
      '所有合作酒吧可用',
      'HK$200消費額度',
      '免費註冊即可使用',
      '每次啟用4小時有效',
      '無限次領取'
    ]
  },
]
