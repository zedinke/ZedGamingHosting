import { Injectable } from '@nestjs/common';

export interface CloudflareARecord {
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
}

export interface CloudflareDNSRecord {
  id: string;
  name: string;
  content: string;
  type: string;
  ttl: number;
}

/**
 * CloudflareClient - Manages Cloudflare DNS records
 * Integrates with Cloudflare API v4
 */
@Injectable()
export class CloudflareClient {
  private readonly apiToken: string;
  private readonly zoneId: string;
  private readonly apiUrl: string;

  constructor() {
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN || '';
    this.zoneId = process.env.CLOUDFLARE_ZONE_ID || '';
    this.apiUrl = 'https://api.cloudflare.com/client/v4';

    if (!this.apiToken || !this.zoneId) {
      console.warn('[CloudflareClient] Cloudflare credentials not configured, DNS operations will fail');
    }
  }

  /**
   * Creates an A record in Cloudflare
   */
  async createARecord(data: CloudflareARecord): Promise<CloudflareDNSRecord> {
    if (!this.apiToken || !this.zoneId) {
      throw new Error('Cloudflare API token or zone ID not configured');
    }

    const response = await fetch(
      `${this.apiUrl}/zones/${this.zoneId}/dns_records`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'A',
          name: data.name,
          content: data.content,
          ttl: data.ttl || 300,
          proxied: data.proxied || false,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Cloudflare API error: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    return {
      id: result.result.id,
      name: result.result.name,
      content: result.result.content,
      type: result.result.type,
      ttl: result.result.ttl,
    };
  }

  /**
   * Updates an A record in Cloudflare
   */
  async updateARecord(recordId: string, data: { content?: string; ttl?: number }): Promise<void> {
    if (!this.apiToken || !this.zoneId) {
      throw new Error('Cloudflare API token or zone ID not configured');
    }

    const response = await fetch(
      `${this.apiUrl}/zones/${this.zoneId}/dns_records/${recordId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Cloudflare API error: ${JSON.stringify(error)}`);
    }
  }

  /**
   * Deletes an A record from Cloudflare
   */
  async deleteARecord(recordId: string): Promise<void> {
    if (!this.apiToken || !this.zoneId) {
      throw new Error('Cloudflare API token or zone ID not configured');
    }

    const response = await fetch(
      `${this.apiUrl}/zones/${this.zoneId}/dns_records/${recordId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Cloudflare API error: ${JSON.stringify(error)}`);
    }
  }

  /**
   * Gets a DNS record by name
   */
  async getRecordByName(name: string): Promise<CloudflareDNSRecord | null> {
    if (!this.apiToken || !this.zoneId) {
      throw new Error('Cloudflare API token or zone ID not configured');
    }

    const response = await fetch(
      `${this.apiUrl}/zones/${this.zoneId}/dns_records?name=${encodeURIComponent(name)}&type=A`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Cloudflare API error: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    if (result.result && result.result.length > 0) {
      const record = result.result[0];
      return {
        id: record.id,
        name: record.name,
        content: record.content,
        type: record.type,
        ttl: record.ttl,
      };
    }

    return null;
  }
}

