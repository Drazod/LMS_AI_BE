import { VNPayUtil } from '../utils/VNPayUtil';

export interface VNPayConfig {
  vnp_PayUrl: string;
  vnp_ReturnUrl: string;
  vnp_TmnCode: string;
  secretKey: string;
  vnp_Version: string;
  vnp_Command: string;
  orderType: string;
}

export class VNPayConfigService {
  private config: VNPayConfig;

  constructor() {
    this.config = {
      vnp_PayUrl: process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/vnpay-return',
      vnp_TmnCode: process.env.VNPAY_TMN_CODE || '',
      secretKey: process.env.VNPAY_HASH_SECRET || '',
      vnp_Version: process.env.VNPAY_VERSION || '2.1.0',
      vnp_Command: process.env.VNPAY_COMMAND || 'pay',
      orderType: process.env.VNPAY_ORDER_TYPE || 'other'
    };
  }

  getVNPayConfig(): Map<string, string> {
    const vnpParamsMap = new Map<string, string>();
    
    vnpParamsMap.set('vnp_Version', this.config.vnp_Version);
    vnpParamsMap.set('vnp_Command', this.config.vnp_Command);
    vnpParamsMap.set('vnp_TmnCode', this.config.vnp_TmnCode);
    vnpParamsMap.set('vnp_CurrCode', 'VND');
    vnpParamsMap.set('vnp_TxnRef', VNPayUtil.getRandomNumber(8));
    vnpParamsMap.set('vnp_OrderType', this.config.orderType);
    vnpParamsMap.set('vnp_Locale', 'vn');
    vnpParamsMap.set('vnp_ReturnUrl', this.config.vnp_ReturnUrl);

    // Set timezone to GMT+7 (Vietnam)
    const now = new Date();
    const vnCreateDate = this.formatDateTime(now);
    vnpParamsMap.set('vnp_CreateDate', vnCreateDate);

    // Add 15 minutes for expiry
    const expireDate = new Date(now.getTime() + 15 * 60 * 1000);
    const vnExpireDate = this.formatDateTime(expireDate);
    vnpParamsMap.set('vnp_ExpireDate', vnExpireDate);

    return vnpParamsMap;
  }

  private formatDateTime(date: Date): string {
    // Format: yyyyMMddHHmmss in GMT+7
    const offset = 7 * 60; // GMT+7 in minutes
    const localDate = new Date(date.getTime() + offset * 60 * 1000);
    
    const year = localDate.getUTCFullYear();
    const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(localDate.getUTCDate()).padStart(2, '0');
    const hours = String(localDate.getUTCHours()).padStart(2, '0');
    const minutes = String(localDate.getUTCMinutes()).padStart(2, '0');
    const seconds = String(localDate.getUTCSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  getVnpPayUrl(): string {
    return this.config.vnp_PayUrl;
  }

  getSecretKey(): string {
    return this.config.secretKey;
  }
}
