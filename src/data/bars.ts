import { Bar } from '../types'

export const bars: Bar[] = [
  // 蘭桂坊
  {
    id: 'bar-1',
    name: 'Dragon-i',
    nameEn: 'Dragon-i',
    districtId: 'lan-kwai-fong',
    address: '中環雲咸街60號',
    image: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400',
    pricePerPerson: 250,
    rating: 4.5,
    drinks: ['啤酒', '雞尾酒', '威士忌', '伏特加']
  },
  {
    id: 'bar-2',
    name: 'Volar',
    nameEn: 'Volar',
    districtId: 'lan-kwai-fong',
    address: '中環德己立街38-44號',
    image: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400',
    pricePerPerson: 250,
    rating: 4.3,
    drinks: ['啤酒', '雞尾酒', '龍舌蘭']
  },
  {
    id: 'bar-3',
    name: 'Levels',
    nameEn: 'Levels',
    districtId: 'lan-kwai-fong',
    address: '中環德己立街30號',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400',
    pricePerPerson: 250,
    rating: 4.2,
    drinks: ['啤酒', '雞尾酒', '清酒']
  },
  // 中環
  {
    id: 'bar-4',
    name: 'Stockton',
    nameEn: 'Stockton',
    districtId: 'central',
    address: '中環士丹頓街32號',
    image: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=400',
    pricePerPerson: 250,
    rating: 4.6,
    drinks: ['精釀啤酒', '威士忌', '雞尾酒']
  },
  {
    id: 'bar-5',
    name: 'Quinary',
    nameEn: 'Quinary',
    districtId: 'central',
    address: '中環荷李活道56-58號',
    image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400',
    pricePerPerson: 250,
    rating: 4.8,
    drinks: ['分子雞尾酒', '經典雞尾酒']
  },
  // 灣仔
  {
    id: 'bar-6',
    name: 'The Pawn',
    nameEn: 'The Pawn',
    districtId: 'wan-chai',
    address: '灣仔莊士敦道62號',
    image: 'https://images.unsplash.com/photo-1525268323446-0505b6fe7778?w=400',
    pricePerPerson: 250,
    rating: 4.4,
    drinks: ['啤酒', '葡萄酒', '雞尾酒']
  },
  {
    id: 'bar-7',
    name: 'Canny Man',
    nameEn: 'Canny Man',
    districtId: 'wan-chai',
    address: '灣仔駱克道93號',
    image: 'https://images.unsplash.com/photo-1571204829887-3b8d69e4094d?w=400',
    pricePerPerson: 250,
    rating: 4.1,
    drinks: ['威士忌', '啤酒', '蘇格蘭威士忌']
  },
  // 尖沙咀
  {
    id: 'bar-8',
    name: 'Aqua Spirit',
    nameEn: 'Aqua Spirit',
    districtId: 'tsim-sha-tsui',
    address: '尖沙咀北京道1號',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400',
    pricePerPerson: 250,
    rating: 4.7,
    drinks: ['香檳', '雞尾酒', '葡萄酒']
  },
  {
    id: 'bar-9',
    name: 'Ozone',
    nameEn: 'Ozone',
    districtId: 'tsim-sha-tsui',
    address: '尖沙咀柯士甸道西1號',
    image: 'https://images.unsplash.com/photo-1560624052-449f5ddf0c31?w=400',
    pricePerPerson: 250,
    rating: 4.9,
    drinks: ['雞尾酒', '香檳', '清酒']
  },
  // 蘇豪區
  {
    id: 'bar-10',
    name: 'Ping Pong 129',
    nameEn: 'Ping Pong 129',
    districtId: 'soho',
    address: '中環蘇豪伊利近街129號',
    image: 'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=400',
    pricePerPerson: 250,
    rating: 4.3,
    drinks: ['琴酒', '雞尾酒', '啤酒']
  },
  // 銅鑼灣
  {
    id: 'bar-11',
    name: 'Executive Bar',
    nameEn: 'Executive Bar',
    districtId: 'causeway-bay',
    address: '銅鑼灣告士打道280號',
    image: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400',
    pricePerPerson: 250,
    rating: 4.2,
    drinks: ['威士忌', '雞尾酒', '啤酒']
  },
  // 旺角
  {
    id: 'bar-12',
    name: 'Kowloon Taproom',
    nameEn: 'Kowloon Taproom',
    districtId: 'mong-kok',
    address: '旺角通菜街2號',
    image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400',
    pricePerPerson: 250,
    rating: 4.0,
    drinks: ['精釀啤酒', '本地啤酒']
  },
  // 荃灣
  {
    id: 'bar-13',
    name: 'The Hangout',
    nameEn: 'The Hangout',
    districtId: 'tsuen-wan',
    address: '荃灣眾安街68號',
    image: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400',
    pricePerPerson: 250,
    rating: 4.2,
    drinks: ['啤酒', '雞尾酒', '威士忌']
  },
  {
    id: 'bar-14',
    name: 'Chill Bar',
    nameEn: 'Chill Bar',
    districtId: 'tsuen-wan',
    address: '荃灣沙咀道21號',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400',
    pricePerPerson: 250,
    rating: 4.0,
    drinks: ['精釀啤酒', '雞尾酒', '清酒']
  },
  {
    id: 'bar-15',
    name: '荃灣酒窖',
    nameEn: 'TW Wine Cellar',
    districtId: 'tsuen-wan',
    address: '荃灣川龍街9號',
    image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400',
    pricePerPerson: 250,
    rating: 4.3,
    drinks: ['葡萄酒', '威士忌', '白蘭地']
  },
  {
    id: 'bar-16',
    name: '82',
    nameEn: '82',
    districtId: 'tsuen-wan',
    address: '荃灣聯仁街12-26號石壁新村地下24號舖',
    image: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400',
    pricePerPerson: 250,
    rating: 4.5,
    drinks: ['啤酒', '雞尾酒', '威士忌']
  },
]

export const getBarsByDistrict = (districtId: string): Bar[] => {
  return bars.filter(bar => bar.districtId === districtId)
}
