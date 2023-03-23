import { Injectable } from '@nestjs/common'
import { InjectKnex, Knex } from 'nestjs-knex'
import { replaceAll } from 'src/helpers'

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
      .where('status', PromptStatus.Active)
      .orderByRaw('random()')
      .first()

    if (prompt) {
      return prompt
    }

    return null
  }

  splitTextToPrompts(prompt: Prompt): string[] {
    return prompt.text
      .split('//')
      .map(promptText => promptText.trim())
  }

  async findAllActive(): Promise<Prompt[]> {
    return this.knex
      .from<Prompt>(this.tableName)
      .select('*')
      .where('status', PromptStatus.Active)
      .orderBy('id', 'asc')
  }

  async hasAnyActive(): Promise<boolean> {
    const prompts = await this.findAllActive()

    return prompts.length !== 0
  }

  async remove(prompt: Prompt): Promise<void> {
    await this.knex
      .table<Prompt>(this.tableName)
      .where('id', prompt.id)
      .delete()
  }

  async persist(prompt: Prompt): Promise<Prompt> {
    const text = replaceAll(replaceAll(prompt.text, '//', ' // '), '  ', ' ')

    let result: Prompt[]
    if (prompt.id !== undefined) {
      result = await this.knex
        .table<Prompt>(this.tableName)
        .where('id', prompt.id)
        .returning('*')
        .update({
          ...prompt,
          text,
          updated_at: new Date()
        })
    } else {
      result = await this.knex
        .table<Prompt>(this.tableName)
        .returning('*')
        .insert({
          ...prompt,
          text,
        })
    }

    if (result[0] === undefined) {
      throw new Error('Cannot save prompt')
    }

    return result[0]
  }
}
