import type { PlantBox, CareStrategy } from '../types/plantBox.types'

export const mockPlantBoxes: PlantBox[] = [
  {
    _id: 'box1',
    userId: 'user1',
    name: 'Cà chua vườn sau',
    type: 'active',
    plantName: 'Cà chua',
    scientificName: 'Solanum lycopersicum',
    plantedDate: '2024-01-15T00:00:00.000Z',
    location: {
      name: 'Vườn sau nhà',
      coordinates: { lat: 10.762622, lng: 106.660172 },
      area: 10,
      soilType: 'Đất pha cát',
      sunlight: 'full',
    },
    quantity: 5,
    growthStage: 'vegetative',
    currentHealth: 'good',
    images: [
      {
        _id: 'img1',
        url: 'https://images.unsplash.com/photo-1592496001020-d31bd830651f?w=800',
        description: 'Cây sau 1 tuần',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    notes: [
      {
        _id: 'note1',
        type: 'care',
        content: 'Đã bón phân NPK 20-20-20, cây phát triển tốt',
        date: new Date().toISOString(),
      },
      {
        _id: 'note2',
        type: 'observation',
        content: 'Lá có dấu hiệu vàng nhẹ, cần theo dõi',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    specialRequirements: 'Cần tưới nước đều đặn, tránh úng nước',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'box2',
    userId: 'user1',
    name: 'Rau cải xanh',
    type: 'active',
    plantName: 'Cải xanh',
    scientificName: 'Brassica rapa',
    plantedDate: '2024-01-10T00:00:00.000Z',
    location: {
      name: 'Vườn trước',
      area: 5,
      soilType: 'Đất phù sa',
      sunlight: 'partial',
    },
    quantity: 10,
    growthStage: 'vegetative',
    currentHealth: 'excellent',
    images: [
      {
        _id: 'img2',
        url: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800',
        description: 'Cải xanh tươi tốt',
        date: new Date().toISOString(),
      },
    ],
    notes: [],
    createdAt: '2024-01-10T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'box3',
    userId: 'user1',
    name: 'Ớt chuông',
    type: 'planned',
    plantName: 'Ớt chuông',
    scientificName: 'Capsicum annuum',
    plannedDate: '2024-02-01T00:00:00.000Z',
    location: {
      name: 'Vườn sau nhà',
      area: 8,
      soilType: 'Đất pha cát',
      sunlight: 'full',
    },
    quantity: 3,
    growthStage: 'seed',
    images: [],
    notes: [],
    specialRequirements: 'Cần nhiều ánh sáng mặt trời',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
  },
]

export const generateMockCareStrategy = (plantBoxId: string): CareStrategy => {
  const days: any[] = []

  for (let i = 0; i < 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)

    const isRainy = Math.random() > 0.7
    const temp = { min: 22 + Math.random() * 3, max: 28 + Math.random() * 5 }
    const humidity = 60 + Math.random() * 20
    const rain = isRainy ? Math.random() * 30 : 0

    const actions: any[] = []

    // Watering action
    if (i === 0 || !isRainy) {
      actions.push({
        _id: `action${i}1`,
        time: '08:00',
        description: i === 0 ? 'Tưới 500ml nước' : 'Tưới 300ml nước',
        reason: temp.max > 30 ? 'Nhiệt độ cao, độ ẩm thấp' : 'Duy trì độ ẩm',
        completed: i === 0,
        type: 'watering',
      })
    }

    // Fertilizing action
    if (i === 1 || i === 4) {
      actions.push({
        _id: `action${i}2`,
        time: '10:00',
        description: 'Bón phân NPK 20-20-20, 10g',
        reason: isRainy ? 'Sau mưa, đất ẩm' : 'Định kỳ bón phân',
        completed: false,
        type: 'fertilizing',
        products: [
          {
            name: 'Phân bón NPK 20-20-20',
            link: 'https://shopee.vn/product',
          },
        ],
      })
    }

    // Inspection action
    actions.push({
      _id: `action${i}3`,
      time: '18:00',
      description: 'Kiểm tra lá',
      reason: isRainy ? 'Cảnh báo mưa lớn' : 'Theo dõi sức khỏe',
      completed: false,
      type: 'inspection',
    })

    // Protection action on rainy days
    if (isRainy) {
      actions.push({
        _id: `action${i}4`,
        time: '14:00',
        description: 'Che phủ cây',
        reason: `Mưa lớn dự báo ${Math.round(rain)}mm`,
        completed: false,
        type: 'protection',
      })
    }

    days.push({
      date: date.toISOString(),
      weather: {
        temp,
        humidity,
        rain,
        alerts: isRainy ? ['Mưa lớn'] : [],
      },
      actions,
    })
  }

  return {
    plantBoxId,
    lastUpdated: new Date().toISOString(),
    next7Days: days,
  }
}
