const logPolicyStatement = {
  Effect: "Allow",
  Action: [
    "logs:CreateLogStream",
    "logs:CreateLogGroup",
    "logs:TagResource",
    "logs:PutLogEvents",
  ],
  Resource: [
    {
      "Fn::Sub":
        "arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:*",
    },
  ],
};

class SimplifyDefaultExecRole {
  constructor(serverless) {
    this.hooks = {
      "before:package:finalize": function () {
        simplifyBaseIAMLogGroups(serverless);
      },
    };
  }
}

function simplifyBaseIAMLogGroups(serverless) {
  const resourceSection =
    serverless.service.provider.compiledCloudFormationTemplate.Resources;

  for (const key in resourceSection) {
    if (key === "IamRoleLambdaExecution") {
      const statements =
        resourceSection[key].Properties.Policies[0].PolicyDocument.Statement;
      const newStatement = statements.filter((item) => {
        const action = item?.Action;
        const firstStatementCheck =
          Array.isArray(action) &&
          action.includes("logs:CreateLogStream") &&
          action.includes("logs:CreateLogGroup") &&
          action.includes("logs:TagResource");
        const secondStatementCheck =
          Array.isArray(action) &&
          action.includes("logs:PutLogEvents");
        return !(firstStatementCheck || secondStatementCheck);
      });

      resourceSection[key].Properties.Policies[0].PolicyDocument.Statement = [
        logPolicyStatement,
        ...newStatement,
      ];
    }
  }
}

module.exports = SimplifyDefaultExecRole;
