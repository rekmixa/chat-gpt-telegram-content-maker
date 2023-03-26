import { Injectable } from '@nestjs/common'
import { InjectKnex, Knex } from 'nestjs-knex'

export enum SettingKey {
  Auto = 'auto',
}

export enum SettingBooleanValue {
  True = 'true',
  False = 'false',
}

export interface Setting {
  readonly id?: number
  key: SettingKey
  value: SettingBooleanValue | null
  readonly created_at?: Date
  readonly updated_at?: Date
}

@Injectable()
export class SettingRepository {
  private readonly tableName: string = 'settings'

  constructor(@InjectKnex() private readonly knex: Knex) {}

  async isAutoEnabled(): Promise<boolean> {
    const value = await this.get(SettingKey.Auto)

    return value === SettingBooleanValue.True
  }

  async get(key: SettingKey): Promise<SettingBooleanValue> {
    const setting = await this.knex
      .from<Setting>(this.tableName)
      .select('*')
      .where('key', key)
      .first()

    if (setting && setting.value !== null) {
      return setting.value
    }

    return SettingBooleanValue.False
  }

  async set(key: SettingKey, value: SettingBooleanValue): Promise<void> {
    const result: Setting[] = await this.knex
      .table<Setting>(this.tableName)
      .where('key', key)
      .returning('*')
      .update({
        value,
      })

    if (result.length === 0) {
      await this.knex
        .table<Setting>(this.tableName)
        .returning('*')
        .insert({
          key,
          value,
        })
    }
  }
}
