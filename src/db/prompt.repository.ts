import { Injectable } from '@nestjs/common'
import { InjectKnex, Knex } from 'nestjs-knex'

export enum PromptStatus {
  Active = 'active',
  Inactive = 'inactive',
}

export interface Prompt {
  readonly id?: number
  text: string
  status?: PromptStatus
  readonly created_at?: Date
  readonly updated_at?: Date
}

@Injectable()
export class PromptRepository {
  private readonly tableName: string = 'prompts'

  constructor(
    @InjectKnex() private readonly knex: Knex,
  ) { }

  async findById(id: number): Promise<Prompt | null> {
    const prompt = await this.knex
      .from<Prompt>(this.tableName)
      .select('*')
      .where('id', id)
      .first()

    if (prompt) {
      return prompt
    }

    return null
  }

  async getById(id: number): Promise<Prompt> {
    const prompt = await this.findById(id)
    if (prompt === null) {
      throw new Error(`Cannot get prompt ${id}`)
    }

    return prompt
  }

  async findRandom(): Promise<Prompt | null> {
    const prompt = await this.knex
      .from<Prompt>(this.tableName)
      .select('*')
      .orderBy('random()')
      .first()

    if (prompt) {
      return prompt
    }

    return null
  }

  async findAll(): Promise<Prompt[]> {
    return this.knex
      .from<Prompt>(this.tableName)
      .select('*')
      .orderBy('id', 'asc')
  }

  async remove(prompt: Prompt): Promise<void> {
    await this.knex
      .table<Prompt>(this.tableName)
      .where('id', prompt.id)
      .delete()
  }

  async persist(prompt: Prompt): Promise<Prompt> {
    let result: Prompt[]
    if (prompt.id !== undefined) {
      result = await this.knex
        .table<Prompt>(this.tableName)
        .where('id', prompt.id)
        .returning('*')
        .update({
          ...prompt,
          updated_at: new Date()
        })
    } else {
      result = await this.knex
        .table<Prompt>(this.tableName)
        .returning('*')
        .insert(prompt)
    }

    if (result[0] === undefined) {
      throw new Error('Cannot save prompt')
    }

    return result[0]
  }
}
