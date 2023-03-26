import { Injectable } from '@nestjs/common'
import { InjectKnex, Knex } from 'nestjs-knex'

export interface Schedule {
  readonly id?: number
  time: string
  is_active: boolean
  readonly created_at?: Date
  readonly updated_at?: Date
}

@Injectable()
export class ScheduleRepository {
  private readonly tableName: string = 'schedules'

  constructor(@InjectKnex() private readonly knex: Knex) {}

  async findById(id: number): Promise<Schedule | null> {
    const schedule = await this.knex
      .from<Schedule>(this.tableName)
      .select('*')
      .where('id', id)
      .first()

    if (schedule) {
      return schedule
    }

    return null
  }

  async findByTime(time: string): Promise<Schedule | null> {
    const schedule = await this.knex
      .from<Schedule>(this.tableName)
      .select('*')
      .where('time', time)
      .first()

    if (schedule) {
      return schedule
    }

    return null
  }

  async getById(id: number): Promise<Schedule> {
    const schedule = await this.findById(id)
    if (schedule === null) {
      throw new Error(`Cannot get schedule ${id}`)
    }

    return schedule
  }

  async findAll(): Promise<Schedule[]> {
    return this.knex
      .from<Schedule>(this.tableName)
      .select('*')
      .orderBy('id', 'asc')
  }

  async getSchedules(): Promise<Schedule[]> {
    const result: Schedule[] = []
    for (let i = 0; i < 24; i++) {
      const time = `${i < 10 ? 0 : ''}${i}:00`
      const schedule = await this.findByTime(time)
      if (schedule) {
        result.push(schedule)
      } else {
        result.push(await this.persist({ time, is_active: false }))
      }
    }

    return result
  }

  async getActiveSchedulesCount(): Promise<number> {
    const schedules = await this.getSchedules()
    const activeSchdeules = schedules.filter(schedule => schedule.is_active)

    return activeSchdeules.length
  }

  async remove(schedule: Schedule): Promise<void> {
    await this.knex
      .table<Schedule>(this.tableName)
      .where('id', schedule.id)
      .delete()
  }

  async persist(schedule: Schedule): Promise<Schedule> {
    let result: Schedule[]
    if (schedule.id !== undefined) {
      result = await this.knex
        .table<Schedule>(this.tableName)
        .where('id', schedule.id)
        .returning('*')
        .update({
          ...schedule,
          updated_at: new Date(),
        })
    } else {
      result = await this.knex
        .table<Schedule>(this.tableName)
        .returning('*')
        .insert(schedule)
    }

    if (result[0] === undefined) {
      throw new Error('Cannot save schedule')
    }

    return result[0]
  }
}
