import crypto from 'crypto';
import { Request } from 'express';

export class VNPayUtil {
  /**
   * Generate HMAC SHA512 hash
   */
  static hmacSHA512(key: string, data: string): string {
    try {
      if (!key || !data) {
        throw new Error('Key and data are required');
      }
      const hmac = crypto.createHmac('sha512', key);
      hmac.update(Buffer.from(data, 'utf-8'));
      return hmac.digest('hex');
    } catch (error) {
      console.error('Error generating HMAC:', error);
      return '';
    }
  }

  /**
   * Get IP address from request
   */
  static getIpAddress(request: Request): string {
    try {
      const ipAddress = request.headers['x-forwarded-for'] as string || request.ip || request.connection.remoteAddress || '127.0.0.1';
      console.log('IP Address:', ipAddress);
      return ipAddress;
    } catch (error) {
      return `Invalid IP: ${error}`;
    }
  }

  /**
   * Generate random number string
   */
  static getRandomNumber(length: number): string {
    const chars = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Build payment URL from parameters map
   */
  static getPaymentURL(paramsMap: Map<string, string>, encodeKey: boolean): string {
    const sortedParams = Array.from(paramsMap.entries())
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

    return sortedParams
      .map(([key, value]) => {
        const encodedKey = encodeKey ? encodeURIComponent(key) : key;
        const encodedValue = encodeURIComponent(value);
        return `${encodedKey}=${encodedValue}`;
      })
      .join('&');
  }
}
