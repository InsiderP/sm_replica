import { Controller, Get } from '@nestjs/common';

@Controller()
export class RootController {
  @Get()
  root() {
    return { success: true, message: 'API is running', basePath: '/v1' };
  }
}


