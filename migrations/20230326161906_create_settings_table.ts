import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('settings', table => {
    table.increments()
    table.string('key')
    table.text('value').nullable()
    table.timestamps(false, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('settings')
}
