# Versions

## [Unreleased]

## [1.0.0] - 2024-10-11
### Added
- OPENAI_BASE_URL param to env
### Changed
- upgraded node js to v18.20.4
- upgraded openai package to v4.67.3

## [0.3.0] - 2023-03-26
### Added
- automatic mode

## [0.2.1] - 2023-03-26
### Changed
- template for edit prompt message
### Fixed
- checking schedule logic

## [0.2.0] - 2023-03-26
### Added
- ability to edit posts schedule in telegram bot

## [0.1.1] - 2023-03-24
### Changed
- crontab rule for generate posts task

## [0.1.0] - 2023-03-23
### Added
- Prompt entity
- CRUD for promopts in telegram bot
- using prompts while generating posts
### Changed
- language for telegram bot interface to Russian

## [0.0.2] - 2023-03-23
### Added
- checking for post is published on handling callback query
### Changed
- logger: add sending errors to telegram
### Fixed
- cron schedule for send posts task

## [0.0.1] - 2023-03-22
### Added
- Initialize Nest JS project with Telegram API & OpenAI
- Add logic for generating, moderating and publishing posts
- knex & post repository
- generating posts in scheduler
- sending scheduled posts
