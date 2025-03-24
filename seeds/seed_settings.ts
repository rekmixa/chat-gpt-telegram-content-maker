import { Knex } from 'knex'
import { SettingBooleanValue, SettingKey } from '../src/db/setting.repository'

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('settings').del()

  // Inserts seed entries
  await knex('settings').insert([
    { key: SettingKey.Enabled, value: SettingBooleanValue.True },
    { key: SettingKey.Auto, value: SettingBooleanValue.False },
  ])
}
