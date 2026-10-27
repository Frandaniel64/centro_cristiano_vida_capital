import { Global, Module } from '@nestjs/common';
import { AntiSpamService } from './anti-spam.service.js';
import { EmailService } from './email.service.js';

@Global()
@Module({
  providers: [AntiSpamService, EmailService],
  exports: [AntiSpamService, EmailService],
})
export class ComunModule {}
