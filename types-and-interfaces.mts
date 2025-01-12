export interface MockChalk {
  green: jest.Mock<string, [string]>;
  blue: jest.Mock<string, [string]>;
  gray: jest.Mock<string, [string]>;
  yellow: jest.Mock<string, [string]>;
}

export type Choice<Value> = {
  value: Value;
  name?: string;
  description?: string;
  short?: string;
  disabled?: boolean | string;
};
