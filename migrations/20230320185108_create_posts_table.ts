import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('posts', table => {
    table.increments()
    table.text('content')
    table.boolean('status').defaultTo('moderating')
    table.timestamps(false, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('posts')
}
