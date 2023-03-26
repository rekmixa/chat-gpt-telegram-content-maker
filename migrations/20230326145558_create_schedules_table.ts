import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('schedules', table => {
    table.increments()
    table.string('time', 5)
    table.boolean('is_active').defaultTo(false)
    table.timestamps(false, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('schedules')
}
