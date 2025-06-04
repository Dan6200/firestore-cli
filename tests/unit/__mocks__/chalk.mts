import { jest } from "@jest/globals";

export interface MockChalk {
  green: jest.Mock<(text: string) => string>;
  blue: jest.Mock<(text: string) => string>;
  gray: jest.Mock<(text: string) => string>;
  yellow: jest.Mock<(text: string) => string>;
}

export const chalk: MockChalk = {
  green: jest.fn((text: string) => text),
  blue: jest.fn((text: string) => text),
  yellow: jest.fn((text: string) => text),
  gray: jest.fn((text: string) => text),
};
