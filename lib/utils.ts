import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { 
  Utensils, Coffee, Wine, Bus, Car, ShoppingBag, Fuel, Tv, Film, Home, 
  Smartphone, PiggyBank, HeartPulse, GraduationCap, HeartHandshake, 
  Briefcase, BadgeDollarSign, Clock, Store, Gift, TrendingUp, Landmark, Building, FileText
} from 'lucide-react'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatThaiCurrency(amount: number): string {
  return `฿${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatThaiDate(date: string | Date): string {
  const d = new Date(date)
  const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`
}

export function formatThaiTime(time: string): string {
  return `${time.slice(0, 5)} น.`
}

export function getThaiMonthName(month: number): string {
  const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
  return months[month] || ''
}

export const LUCIDE_CATEGORY_ICON_MAP: Record<string, any> = {
  'อาหาร': Utensils,
  'กาแฟ': Coffee,
  'เครื่องดื่ม': Wine,
  'ค่าเดินทาง': Bus,
  'แท็กซี่': Car,
  'ช้อปออนไลน์': ShoppingBag,
  'น้ำมันรถ': Fuel,
  'สังสรรค์': Tv,
  'ดูหนัง': Film,
  'ค่าเช่า': Home,
  'ค่าโทรศัพท์': Smartphone,
  'เงินออม': PiggyBank,
  'สุขภาพ': HeartPulse,
  'การศึกษา': GraduationCap,
  'แม่ให้มา': HeartHandshake,
  'เงินเดือน': Briefcase,
  'งานเสริม': BadgeDollarSign,
  'ล่วงเวลา': Clock,
  'ขายออนไลน์': Store,
  'โบนัส': Gift,
  'ดอกเบี้ย': TrendingUp,
  'ลงทุน': Landmark,
  'ขายของเก่า': ShoppingBag,
}

export function getLucideCategoryIcon(categoryName: string) {
  return LUCIDE_CATEGORY_ICON_MAP[categoryName] || FileText
}

export function formatFullThaiDateTime(dateStr?: string, timeStr?: string): string {
  if (!dateStr) return timeStr ? `${timeStr.slice(0, 5)} น.` : ''
  
  let formattedDate = dateStr
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      const day = parseInt(parts[2])
      const monthIdx = parseInt(parts[1]) - 1
      const shortMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
      const yr = (parseInt(parts[0]) + 543) % 100
      formattedDate = `${day} ${shortMonths[monthIdx] || ''} ${yr}`
    }
  }

  const cleanTime = timeStr ? timeStr.slice(0, 5) : ''
  return cleanTime ? `${formattedDate} ${cleanTime} น.` : formattedDate
}

export async function compressImage(
  file: File,
  maxDimension = 1200,
  quality = 0.8
): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('ชนิดไฟล์ไม่ถูกต้อง กรุณาเลือกไฟล์รูปภาพเท่านั้นครับ')
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('ไม่สามารถบีบอัดรูปภาพได้'))
        return
      }

      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('บีบอัดรูปภาพล้มเหลว'))
          }
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('อ่านไฟล์รูปภาพไม่สำเร็จ'))
    }

    img.src = url
  })
}

export async function compressAvatarImage(
  file: File,
  targetSize = 256,
  quality = 0.85
): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('ชนิดไฟล์ไม่ถูกต้อง กรุณาเลือกไฟล์รูปภาพเท่านั้นครับ')
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      const minDim = Math.min(img.width, img.height)
      const sourceX = (img.width - minDim) / 2
      const sourceY = (img.height - minDim) / 2

      const canvas = document.createElement('canvas')
      canvas.width = targetSize
      canvas.height = targetSize
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('ไม่สามารถประมวลผลรูปภาพได้'))
        return
      }

      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, targetSize, targetSize)
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(
        img,
        sourceX, sourceY, minDim, minDim,
        0, 0, targetSize, targetSize
      )

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('บีบอัดรูปโปรไฟล์ล้มเหลว'))
          }
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('อ่านไฟล์รูปภาพไม่สำเร็จ'))
    }

    img.src = url
  })
}
