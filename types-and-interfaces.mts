export interface MockChalk {
  green: jest.Mock<string, [string]>;
  blue: jest.Mock<string, [string]>;
  gray: jest.Mock<string, [string]>;
  yellow: jest.Mock<string, [string]>;
}

export interface Options {
  databaseId?: string;
  where?: [string, "==" | ">=" | "<=" | "!=", string];
}
