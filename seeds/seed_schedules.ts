import { Knex } from 'knex'

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('schedules').del()

  // Inserts seed entries
  await knex('schedules').insert([
    { time: '09:00', is_active: true },
    { time: '10:00', is_active: true },
    { time: '11:00', is_active: true },
    { time: '12:00', is_active: true },
    { time: '13:00', is_active: true },
    { time: '14:00', is_active: true },
    { time: '15:00', is_active: true },
    { time: '16:00', is_active: true },
    { time: '17:00', is_active: true },
    { time: '18:00', is_active: true },
  ])
}
